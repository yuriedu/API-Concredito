const C6 = require('../../APIs/C6');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, fasesAgilus } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []
var logs = false

const C6Esteira = async (pool, log) => {
  try {
    console.log('[C6 Esteira]=> Iniciando...')
    const c6 = await new C6();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await c6.refreshToken(log)
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
      var agilus = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',626).execute('pr_getPropostas_by_Bank_and_Date')
      agilus.recordset = agilus.recordset.filter(r=> r.NumeroContrato && r.NumeroContrato != 0)
      agilus.recordset.forEach((proposta, index)=>{
        queue[queue.length] = { codigo: proposta.NumeroContrato, agilus: proposta }
        if (queue.length == 1) return verifyFase(c6, pool)
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[C6 Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { C6Esteira }

async function verifyFase(c6, pool) {
  if (queue.length <= 0 || !queue[0]) return console.log(`[C6 Esteira]=> Finalizado!`);
  await timeout(500)
  var fila = queue[0]
  const getProposta = await c6.getProposta(fila.agilus.NumeroContrato, { af: "C6 ESTEIRA" })
  if (getProposta && getProposta.data) {
    if (getProposta.data.loan_track && getProposta.data.loan_track.current_activity_description) {
      var faseAtividade = fases.find(r=> getProposta.data.loan_track.current_activity_description.includes(r.atividade) && r.situacao == getProposta.data.loan_track.situation)
      if (faseAtividade) {
        var fase = faseAtividade.status[getProposta.data.loan_track.current_activity_number]
        if (fase) {
          if (!fase.oldFase || !fase.oldFase[0] || fase.oldFase.find(r=> r == fila.agilus.CodFase)) {
            fila.faseName = fasesAgilus[fase.newFase] ? fasesAgilus[fase.newFase] : 'Não encontrada...'
            await pool.request()
            .input('contrato',fila.agilus.NumeroContrato)
            .input('fase',fase.newFase)
            .input('bank',626)
            .input('texto',`[C6 ESTEIRA]=> Fase alterada para: ${fila.faseName}!${fase.motivo ? '\nMotivo: '+fase.motivo : ''}`)
            .execute('pr_changeFase_by_contrato')
            if (logs) console.log(`[C6 Esteira]=> Contrato: ${fila.agilus.NumeroContrato} - FaseOLD: ${fila.agilus.Fase} - FaseNew: ${fila.faseName}${fase.motivo ? '\nMotivo: '+fase.motivo : ''}`)
          }
        } else console.log(`[C6 Esteira  ${fila.agilus.NumeroContrato}] => Novo Status - Situação: ${getProposta.data.loan_track.situation} - Atividade: ${getProposta.data.loan_track.current_activity_description} - Status: ${getProposta.data.loan_track.current_activity_number}`)
      } else console.log(`[C6 Esteira  ${fila.agilus.NumeroContrato}] => Nova Atividade - Situação: ${getProposta.data.loan_track.situation} - Atividade: ${getProposta.data.loan_track.current_activity_description} - Status: ${getProposta.data.loan_track.current_activity_number}`)
    }
  }
  await timeout(2000)
  if (queue.findIndex(r=>r.codigo == fila.agilus.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == fila.agilus.NumeroContrato), 1)
  verifyFase(c6, pool)
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const fases = [
  { situacao: 'INT', atividade: 'PAGO', status: {
    '409': { newFase: '3920', oldFase: ['2','2002','4002','9232', '9923', '692'] }, //CONCLUIDO
  }},
  { situacao: 'AND', atividade: 'MESA PREVENCAO', status: {
    '221': { newFase: '692', oldFase: ['9232','2','4002','9923','10293'], motivo: 'Banco esta analisando a proposta e pode entrar em contato com o cliente! Informar o mesmo sobre o possivel contato' }, //CONCLUIDO
    '222': { newFase: '692', oldFase: ['9232','2','4002','9923','10293'], motivo: 'Banco esta analisando a proposta e pode entrar em contato com o cliente! Informar o mesmo sobre o possivel contato' }, //CONCLUIDO
  }},
  { situacao: 'AND', atividade: 'ANALISE DOCUMENTAL', status: {
    '422': { newFase: '692', oldFase: ['9232','2','4002','9923','10293','9'], motivo: 'Banco esta analisando os documentos do cliente!' }, //CONCLUIDO
  }},
  { situacao: 'AND', atividade: 'ANALISE SELFIE', status: {
    '704': { newFase: '692', oldFase: ['9232','2','4002','9923','10293','9'], motivo: 'Banco esta analisando a selfie do cliente!' }, //CONCLUIDO
  }},
  { situacao: 'AND', atividade: 'EM AVERBACAO', status: {
    '384': { newFase: '10293', motivo: 'Proposta em averbação, OP VERIFICAR', }, //CONCLUIDO
  }},
  { situacao: 'PEN', atividade: 'AJUSTAR MARGEM', status: {
    '14': { newFase: '10293', motivo: 'Proposta em ajustar margem, OP VERIFICAR', }, //CONCLUIDO
  }},
  { situacao: 'PEN', atividade: 'AGUARDA AUTORIZACAO', status: {
    '19': {  newFase: '9', motivo: 'Cliente cancelou a autorização! Favor solicitar para o mesmo gerar novamente para seguirmos com a operação!', }, //CONCLUIDO
  }},
  { situacao: 'PEN', atividade: 'ANALISE CORBAN', status: {
    '105': { newFase: '1111', oldFase: ['9232','2','4002','9923','10293','9','12'] }, //CONCLUIDO
  }},
  { situacao: 'PEN', atividade: 'PEN DOCUMENTOS', status: {
    '404': { newFase: '9', motivo: 'Favor anexar documentos do cliente! E avisar o mesmo, que o banco pode entrar em contato pelo telefone cadastrado!', }, //CONCLUIDO
  }},
  { situacao: 'REP', atividade: 'REPROVA FGTS', status: {
    '958': { newFase: '10293', motivo: 'Proposta foi cancelada no banco! Por favor verificar...' }, //CANCELADO
  }},
  { situacao: 'REP', atividade: 'REPROVA CREDITO', status: {
    '955': { newFase: '10293', motivo: 'Proposta foi cancelada no banco! Por favor verificar...' }, //CANCELADO
  }},
  { situacao: 'PEN', atividade: 'AGUARDA FORM DIG WEB', status: {
    '476': { newFase: '10293', oldFase: ['2','4002','692'], motivo: 'Verificar se o cliente já assinou ou está aguardando envio do documento' }, //NÃO INICIADO //AGUARDANDO ENVIO DOC
    '480': { newFase: '9', oldFase: ['2','4002','9232'], motivo: 'Favor anexar doc frente e verso do cliente' }, //PENDENTE DOCUMENTOS
    '683': { newFase: '10293', oldFase: ['2','4002','692'], motivo: 'Aguardando Selfie', }, //PENDENTE DOCUMENTOS
  }},
]