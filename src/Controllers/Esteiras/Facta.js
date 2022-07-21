const Facta = require('../../APIs/Facta');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, fasesAgilus } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []
var logs = false

const FactaEsteira = async (pool, log) => {
  try {
    console.log('[Facta Esteira]=> Iniciando...')
    const facta = await new Facta();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await facta.refreshToken(log)
    if (loadAPI) {
      var date = moment(new Date(), 'DD/MM/YYYY').format('DD-MM-YYYY');
      var dia = Number(date.slice(0,2))
      var mes = Number(date.slice(3,5))
      var ano = Number(date.slice(6,10))
      if (dia - 7 <= 0) {
        var aux2 = 31
        mes -= 1
        if (mes == 4 || mes == 6 || mes == 9 || mes == 11) aux2 = 30
        if (mes == 2) aux2 = 28
        if (mes <= 0) {
          dia = 31 - ((dia - 7) * - 1)
          mes = 12
          ano -= 1
        } else dia = aux2 - ((dia - 7) * - 1)
      } else dia -= 7
      if (dia < 10) dia = `0${dia}`
      if (mes < 10) mes = `0${mes}`
      const getEsteira = await facta.getEsteira(dia,mes,ano, log)
      if (getEsteira && getEsteira.data) {
        if (getEsteira.data.propostas && getEsteira.data.propostas[0] && getEsteira.data.propostas[0].codigo_af) {
          /*
            ESTEIRA SÓ IRA VERIFICAR PROPOSTAS NESSAS FASES:
            '2': 'Aguardando Averbação',
            '692': 'PROPOSTA EM ANALISE BANCO',
            '2002': 'CLIENTE RECEBEU',
            '4002': 'ASSINADO / RESPONDIDO',
            '9232': 'AGUARDA ASSINATURA DIGITAL',
            '9923': 'Link de assinatura enviado ao cliente',
          */
          var agilus = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',2020).execute('pr_getPropostas_by_Bank_and_Date')
          agilus.recordset = agilus.recordset.filter(r=> r.NumeroContrato && r.NumeroContrato != 0)
          getEsteira.data.propostas = await getEsteira.data.propostas.filter(r=>
            agilus.recordset.find(r2=> r2.NumeroContrato == r.codigo_af) &&
            !r.status_proposta.includes('CLIENTE COM INADIMPLENCIA') && 
            !r.status_proposta.includes('AGUARDA CANCELAMENTO') && 
            !r.status_proposta.includes('RETORNO CORRETOR') && 
            !r.status_proposta.includes('AGUARDA PGTO BCO')
          )
          getEsteira.data.propostas.forEach(async (proposta, index)=>{
            var fases = [
              { status: 'CONTRATO PAGO', newFase: '3920', oldFase: ['2','2002','4002','9232', '9923', '692'] },
              { status: 'AGUARDANDO ASSINATURA DIGITAL', newFase: '120001', oldFase: ['2','4002'] },
              { status: 'AGUARDA AVERBACAO', newFase: '2' },
              { status: 'AVERBADO', newFase: '2' },
              { status: 'ENVIO DATAPREV', newFase: '2' },
              { status: 'ANALISE MESA DE CONFERENCIA', newFase: '10293' },
              { status: 'VALIDANDO DOCUMENTOS', newFase: '692' },
              { status: 'ESTEIRA DE ANALISE', newFase: '692' },
              { status: 'ATUACAO MASTER', newFase: '1111' },
              { status: 'PENDENTE', newFase: '9' },
              { status: 'CANCELADO', newFase: '9' },
              { status: 'CAMPANHA FACTA', newFase: '323' },
            ]
            var fase = fases.find(r=> proposta.status_proposta.includes(r.status))
            if (fase) {
              var propostaAgilus = agilus.recordset.find(r=> r.NumeroContrato == proposta.codigo_af && r.CodFase != fase.newFase)
              if (propostaAgilus) {
                queue[queue.length] = { codigo: proposta.codigo_af, proposta: proposta, agilus: propostaAgilus, fase: fase, faseName: fasesAgilus[fase.newFase] ? fasesAgilus[fase.newFase] : 'Não encontrada...' }
                if (queue.length == 1) {
                  return verifyFase(facta, pool)
                }
              }
            } else console.log(`[Facta Esteira ${proposta.codigo_af}]=> Novo Status: ${proposta.status_proposta}`)
          })
        } else {
          if (getEsteira.data.msg) return { status: false, error: `[ESTEIRA (6)]=> ${getEsteira.data.msg}` }
          if (getEsteira.data.message) return { status: false, error: `[ESTEIRA (5)]=> ${getEsteira.data.message}` }
          if (getEsteira.data.mensagem) return { status: false, error: `[ESTEIRA (4)]=> ${getEsteira.data.mensagem}` }
          if (getEsteira.data.propostas && (!getEsteira.data.propostas[0] || !getEsteira.data.propostas[0].codigo_af)) return { status: false, error: `[ESTEIRA (3)]=> Sem propostas na esteira...` }
          console.log(`[Facta Esteira Error(1)]=>`)
          console.log(getEsteira.data)
          return { status: false, error: '[ESTEIRA (2)]=> Ocorreu algum erro ao puxar todas as propostas! Tente novamente mais tarde...' }
        }
      } else return { status: false, error: '[ESTEIRA (1)]=> Ocorreu algum erro ao puxar todas as propostas! Tente novamente mais tarde', }
    }
  } catch(err) {
    console.log(`[Facta Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { FactaEsteira }

async function verifyFase(facta, pool) {
  if (queue.length <= 0 || !queue[0]) return console.log(`[Facta Esteira]=> Finalizado!`);
  await timeout(500)
  var fila = queue[0]
  if (!fila.fase.oldFase || !fila.fase.oldFase[0] || fila.fase.oldFase.find(r=> r == fila.agilus.CodFase)) {
    if (fila.fase.newFase != 700 && fila.fase.newFase != 9) {
      var verifyAgilus = await pool.request().input('af', fila.agilus.IdContrato).execute('pr_getProposta_by_af');
      if (verifyAgilus && verifyAgilus.recordset && verifyAgilus.recordset[0] && verifyAgilus.recordset[0].CodFase == fila.agilus.CodFase) {
        await pool.request()
          .input('contrato',fila.proposta.codigo_af)
          .input('fase',fila.fase.newFase)
          .input('bank',2020)
          .input('texto',`[FACTA ESTEIRA]=> Fase alterada para: ${fila.faseName}!`)
          .execute('pr_changeFase_by_contrato')
        if (logs) console.log(`[Facta Esteira]=> Contrato: ${fila.proposta.codigo_af} - FaseOLD: ${fila.agilus.Fase} - FaseNew: ${fila.faseName}`)
      }
    } else {
      const getOcorrencias = await facta.getOcorrencias(fila.proposta.codigo_af, { af: "FACTA ESTEIRA" })
      if (getOcorrencias && getOcorrencias.data) {
        if (getOcorrencias.data.ocorrencias && getOcorrencias.data.ocorrencias[0]) {
          var motivo = getOcorrencias.data.ocorrencias.filter(r=> r.obs && r.status &&
            !r.status.includes('Assinatura digital de proposta') &&
            !r.obs.includes('LOCALIZAÇÃO') && 
            !r.obs.includes('LOCALIZAÇAO') && 
            !r.obs.includes('LOCALIZACAO') && 
            !r.obs.includes('Proposta cancelada através da WEB') && 
            !r.obs.includes('Proposta cancelada pelo usuário')
          )
          motivo = motivo.reverse()
          if (motivo && motivo[0]) {
            if (motivo.find(r=> r.status.includes('AGUARDA CANCELAMENTO'))) {
              motivo = motivo.find(r=> r.status.includes('AGUARDA CANCELAMENTO')).obs
            } else if (motivo.find(r=> r.status.includes('CANCELADO'))) {
              motivo = motivo.find(r=> r.status.includes('CANCELADO')).obs
            } else if (motivo.find(r=> r.status.includes('PENDENTE') && r.obs.includes('Validamos apenas CTPS com foto')) && motivo.find(r=> r.status.includes('PENDENTE') && !r.obs.includes('Validamos apenas CTPS com foto'))) {
              motivo = motivo.find(r=> r.status.includes('PENDENTE') && !r.obs.includes('Validamos apenas CTPS com foto')).obs
            } else if (motivo.find(r=> r.status.includes('PENDENTE'))) {
              motivo = motivo.find(r=> r.status.includes('PENDENTE')).obs
            } else motivo = false
          } else motivo = false
          if (motivo) {
            if (motivo.includes('Prazo expirado para assinatura digital')) {
              fila.fase.newFase = '1'
              fila.faseName = 'Inclusão sem conferência'
              motivo = `${motivo} OP. vai refazer o cadastro...`
            }
            var verifyAgilus = await pool.request().input('af', fila.agilus.IdContrato).execute('pr_getProposta_by_af');
            if (verifyAgilus && verifyAgilus.recordset && verifyAgilus.recordset[0] && verifyAgilus.recordset[0].CodFase == fila.agilus.CodFase) {
              await pool.request()
                .input('contrato',fila.proposta.codigo_af)
                .input('fase',fila.fase.newFase)
                .input('bank',2020)
                .input('texto',`[FACTA ESTEIRA]=> Fase alterada para: ${fila.faseName}!\nMotivo: ${motivo}`)
                .execute('pr_changeFase_by_contrato')
              if (logs) console.log(`[Facta Esteira]=> Contrato: ${fila.proposta.codigo_af} - FaseOLD: ${fila.agilus.Fase} - FaseNew: ${fila.faseName}\nMotivo: ${motivo}`)
              await timeout(3000)
            }            
          }
        }
      }
    }
    if (queue.findIndex(r=>r.codigo == fila.proposta.codigo_af) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == fila.proposta.codigo_af), 1)
    verifyFase(facta, pool)
  } else {
    if (queue.findIndex(r=>r.codigo == fila.proposta.codigo_af) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == fila.proposta.codigo_af), 1)
    verifyFase(facta, pool)
  }
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }