const Facta = require('../../APIs/Facta');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []

const FactaEsteira = async (pool, log) => {
  try {
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
          getEsteira.data.propostas = getEsteira.data.propostas.filter(r=> !r.status_proposta.includes('CLIENTE COM INADIMPLENCIA') && !r.status_proposta.includes('AGUARDANDO ASSINATURA DIGITAL') && !r.status_proposta.includes('AGUARDA CANCELAMENTO') && !r.status_proposta.includes('RETORNO CORRETOR') && !r.status_proposta.includes('AGUARDA PGTO BCO'))
          getEsteira.data.propostas.forEach(async(proposta, index)=>{
            //if (index == 0) {
              if (proposta.status_proposta && proposta.codigo_af) {
                var fase = false
                if (proposta.status_proposta.includes('AGUARDA AVERBACAO')) fase = 2 //AGUARDANDO AVERBAÇÃO
                if (proposta.status_proposta.includes('AVERBADO')) fase = 2 //AGUARDANDO AVERBAÇÃO
                if (proposta.status_proposta.includes('ANALISE MESA DE CONFERENCIA')) fase = 2 //AGUARDANDO AVERBAÇÃO
                if (proposta.status_proposta.includes('ATUACAO MASTER')) fase = 1111 //AGUARDANDO ATUAÇÃO MASTER
                if (proposta.status_proposta.includes('VALIDANDO DOCUMENTOS')) fase = 692 //PROPOSTA EM ANALISE BANCO
                if (proposta.status_proposta.includes('CONTRATO PAGO')) fase = 3 //PAGO AO CLIENTE
                if (proposta.status_proposta.includes('ESTEIRA DE ANALISE')) fase = 2 //AGUARDANDO AVERBAÇÃO
                if (proposta.status_proposta.includes('CANCELADO')) fase = 9 //PENDENTE
                if (proposta.status_proposta.includes('PENDENTE')) fase = 9 //PENDENTE
                if (proposta.status_proposta.includes('CAMPANHA FACTA')) fase = 323 //Aguarda Aumento INSS
                if (proposta.status_proposta.includes('ENVIO DATAPREV')) fase = 692 //PROPOSTA EM ANALISE BANCO
                var faseName = false
                if (fase == 2) faseName = 'AGUARDANDO AVERBAÇÃO'
                if (fase == 1111) faseName = 'AGUARDANDO ATUAÇÃO MASTER'
                if (fase == 692) faseName = 'PROPOSTA EM ANALISE BANCO'
                if (fase == 3) faseName = 'PAGO AO CLIENTE'
                if (fase == 4002) faseName = 'ASSINADO / RESPONDIDO'
                if (fase == 700) faseName = 'REPROVADO'
                if (fase == 9) faseName = 'PENDENTE'
                if (fase == 323) faseName = 'AGUARDA AUMENTO INSS'
                if (fase && faseName) {
                  const propostaDB = await pool.request().input('contrato', proposta.codigo_af).input('fase',fase).execute('pr_getProposta_by_contrato_and_not_fase');
                  if (propostaDB.recordset[0]) {
                    if (fase == 3 && propostaDB.recordset[0].CodFase != 2) return;
                    if (fase == 700 || fase == 9) {
                      queue[queue.length] = { codigo: proposta.codigo_af, proposta: proposta, agilus: propostaDB.recordset[0], fase: fase, faseName: faseName }
                      if (queue.length == 1) return verifyReason(facta, pool)
                    } else {
                      await pool.request().input('id', propostaDB.recordset[0].IdContrato).input('faseDestino',fase).input('CodContrato',proposta.codigo_af).input('texto','[ESTEIRA]=> Fase alterada para a mesma que está no banco!').execute('pr_changeFase_by_contrato')
                      return console.log(`[ESTEIRA]=> Contrato: ${proposta.codigo_af} - FaseOLD: ${propostaDB.recordset[0].Fase} - FaseNew: ${faseName}`)
                    }
                  }
                } else console.log(`[Facta ESTEIRA]=> Nova Fase: ${proposta.status_proposta}`)
              }
            //}
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

async function verifyReason(facta, pool) {
  await timeout(3000)
  if (queue <= 0) return;
  var proposta = queue[0].proposta
  var agilus = queue[0].agilus
  var fase = queue[0].fase
  var faseName = queue[0].faseName
  const getOcorrencias = await facta.getOcorrencias(proposta.codigo_af, { af: "ESTEIRA" })
  if (getOcorrencias && getOcorrencias.data) {
    if (getOcorrencias.data.ocorrencias) {
      var motivo = getOcorrencias.data.ocorrencias
      if (motivo.find(r=> r.status.includes('AGUARDA CANCELAMENTO') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')) && motivo[motivo.findIndex(r=> r.status.includes('AGUARDA CANCELAMENTO') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')) - 1] && motivo[motivo.findIndex(r=> r.status.includes('AGUARDA CANCELAMENTO') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')) - 1].obs) {

        motivo = motivo[motivo.findIndex(r=> r.status.includes('AGUARDA CANCELAMENTO') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')) - 1].obs

      } else if (motivo.find(r=> r.status.includes('CANCELADO') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')) && motivo.find(r=> r.status.includes('CANCELADO') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')).obs) {

        motivo = motivo.find(r=> r.status.includes('CANCELADO') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')).obs

      } else if (motivo.find(r=> r.status.includes('PENDENTE') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')) && motivo.find(r=> r.status.includes('PENDENTE') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')).obs) {
        motivo = motivo.find(r=> r.status.includes('PENDENTE') && !r.status.includes('LOCALIZAÇAO') && !r.status.includes('Proposta cancelada através da WEB')).obs
      } else motivo = false
      if (motivo) {
        await pool.request().input('id', agilus.IdContrato).input('faseDestino',motivo.includes('Prazo expirado para assinatura digital') ? 1 : fase).input('CodContrato',proposta.codigo_af).input('texto',`[ESTEIRA]=> Fase alterada para a mesma que está no banco!\nMotivo: ${motivo.includes('Prazo expirado para assinatura digital') ? `${motivo} OP. vai refazer o cadastro...` : motivo}`).execute('pr_changeFase_by_contrato')
        console.log(`[ESTEIRA]=> Contrato: ${proposta.codigo_af} - FaseOLD: ${agilus.Fase} - FaseNew: ${faseName} - Motivo: ${motivo}`)
      }
      if (queue.findIndex(r=> r.codigo == proposta.codigo_af) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.codigo_af), 1)
      return verifyReason(facta, pool)
    } else {
      if (queue.findIndex(r=>r.codigo == proposta.codigo_af) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.codigo_af), 1)
      return verifyReason(facta, pool)
    }
  } else {
      if (queue.findIndex(r=>r.codigo == proposta.codigo_af) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.codigo_af), 1)
      return verifyReason(facta, pool)
  }
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }