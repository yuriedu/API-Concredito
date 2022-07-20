const Facta = require('../../APIs/Facta');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []

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
          const agilusPropostas = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',2020).execute('pr_getPropostas_by_Bank_and_Date')
          getEsteira.data.propostas = await getEsteira.data.propostas.filter(r=>
            agilusPropostas.recordset.find(r2=> r2.NumeroContrato == r.codigo_af) &&
            !r.status_proposta.includes('CLIENTE COM INADIMPLENCIA') && 
            !r.status_proposta.includes('AGUARDA CANCELAMENTO') && 
            !r.status_proposta.includes('RETORNO CORRETOR') && 
            !r.status_proposta.includes('AGUARDA PGTO BCO')
          )
          getEsteira.data.propostas.forEach(async (proposta, index)=>{
            var fases = [
              { status: 'CONTRATO PAGO', fase: '3920', faseName: 'PROPOSTA PAGA', oldFase: ['2','4002','9232', '9923', '692'] },
              { status: 'AGUARDANDO ASSINATURA DIGITAL', fase: '120001', faseName: 'PENDENTE POR ASSINATURA', oldFase: ['2','4002'] },
              { status: 'AGUARDA AVERBACAO', fase: '2', faseName: 'AGUARDANDO AVERBAÇÃO' },
              { status: 'AVERBADO', fase: '2', faseName: 'AGUARDANDO AVERBAÇÃO' },
              { status: 'ENVIO DATAPREV', fase: '2', faseName: 'AGUARDANDO AVERBAÇÃO' },
              { status: 'ANALISE MESA DE CONFERENCIA', fase: '12', faseName: 'Pendência Resolvida' },
              { status: 'VALIDANDO DOCUMENTOS', fase: '692', faseName: 'PROPOSTA EM ANALISE BANCO' },
              { status: 'ESTEIRA DE ANALISE', fase: '692', faseName: 'PROPOSTA EM ANALISE BANCO' },
              { status: 'ATUACAO MASTER', fase: '1111', faseName: 'AGUARDANDO ATUAÇÃO MASTER' },
              { status: 'PENDENTE', fase: '9', faseName: 'PENDENTE' },
              { status: 'CANCELADO', fase: '12', faseName: 'Pendência Resolvida' },
              { status: 'CAMPANHA FACTA', fase: '323', faseName: 'AGUARDA AUMENTO INSS' },
            ]
            var fase = fases.find(r=> proposta.status_proposta.includes(r.status))
            var agilus = agilusPropostas.recordset.find(r=> fase && r.NumeroContrato == proposta.codigo_af && r.CodFase != fase.fase && r.CodFase != 4)
            if (!agilus) return;
            if (fase) {
              queue[queue.length] = { codigo: proposta.codigo_af, proposta: proposta, agilus: agilus, fase: fase, faseName: fase.faseName }
              if (queue.length == 1) return verifyFase(facta, pool)
            } else console.log(`[Facta Esteira CODE: ${proposta.codigo_af}]=> Nova fase: ${proposta.status_proposta}`)
          })
        } else {
          if (getEsteira.data.msg) return { status: false, error: `[ESTEIRA (7)]=> ${getEsteira.data.msg}` }
          if (getEsteira.data.message) return { status: false, error: `[ESTEIRA (6)]=> ${getEsteira.data.message}` }
          if (getEsteira.data.mensagem) return { status: false, error: `[ESTEIRA (5)]=> ${getEsteira.data.mensagem}` }
          if (getEsteira.data.propostas && (!getEsteira.data.propostas[0] || !getEsteira.data.propostas[0].codigo_af)) return { status: false, error: `[ESTEIRA (4)]=> Sem propostas na esteira...` }
          console.log(`[Facta Esteira Error(1)]=>`)
          console.log(getEsteira.data)
          return { status: false, error: '[ESTEIRA (3)]=> Ocorreu algum erro ao puxar todas as propostas! Tente novamente mais tarde...' }
        }
      } else return { status: false, error: '[ESTEIRA (2)]=> Ocorreu algum erro ao puxar todas as propostas! Tente novamente mais tarde', }
    } else return { status: false, error: '[ESTEIRA (1)]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Facta Esteira ERROR] => ${err}`)
    console.log(err)
  }
}
  
module.exports = { FactaEsteira }

async function verifyFase(facta, pool) {
  await timeout(3000)
  if (queue <= 0) return console.log(`[Facta Esteira]=> Finalizado!`);
  var proposta = queue[0].proposta
  var agilus = queue[0].agilus
  if (queue[0].fase.fase == 700 || queue[0].fase.fase == 9) {
    const getOcorrencias = await facta.getOcorrencias(proposta.codigo_af, { af: "FACTA ESTEIRA" })
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
        if (motivo && proposta.codigo_af && proposta.codigo_af != 0 && queue[0].fase.fase && queue[0].fase.fase != 0) {
          if (!queue[0].fase.oldFase || queue[0].fase.oldFase.length <= 0 || queue[0].fase.oldFase.find(r=> r == agilus.CodFase)) {
            console.log(agilus.CodeFase)
            console.log(queue[0].fase.oldFase)
            if (motivo.includes('Prazo expirado para assinatura digital')) queue[0].fase.fase = 1
            await pool.request().input('contrato',proposta.codigo_af).input('fase',queue[0].fase.fase).input('bank',2020).input('texto',`[ESTEIRA]=> Fase alterada para a mesma que está no banco: ${queue[0].fase.fase == 1 ? 'INCLUSÃO' : queue[0].fase.faseName}!\nMotivo: ${queue[0].fase.fase == 1 ? motivo+' OP. vai refazer o cadastro...' : motivo}`).execute('pr_changeFase_by_contrato')
            console.log(`[Facta Esteira]=> Contrato: ${proposta.codigo_af} - FaseOLD: ${agilus.Fase} - FaseNew: ${queue[0].fase.faseName} - Motivo: ${queue[0].fase.fase == 1 ? motivo+' OP. vai refazer o cadastro...' : motivo}`)
          }
        }
      }
    }
  } else {
    if (!queue[0].fase.oldFase || queue[0].fase.oldFase.length <= 0 || queue[0].fase.oldFase.find(r=> r == agilus.CodFase)) {
      console.log(agilus.CodeFase)
      await pool.request().input('contrato',proposta.codigo_af).input('fase',queue[0].fase.fase).input('bank',2020).input('texto',`[ESTEIRA]=> Fase alterada para a mesma que está no banco: ${queue[0].fase.faseName}!`).execute('pr_changeFase_by_contrato')
      console.log(`[Facta Esteira]=> Contrato: ${proposta.codigo_af} - FaseOLD: ${agilus.Fase} - FaseNew: ${queue[0].fase.faseName}`)
    }
  }
  if (queue.findIndex(r=>r.codigo == proposta.codigo_af) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.codigo_af), 1)
  return verifyFase(facta, pool)
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }