const C6 = require('../../APIs/C6');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []

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
      const propostas = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',626).execute('pr_getPropostas_by_Bank_and_Date')
      propostas.recordset.forEach((proposta, index)=>{
        if (proposta.NumeroContrato) {
          queue[queue.length] = { codigo: proposta.NumeroContrato, proposta: proposta }
          if (queue.length == 1) return verifyFaseBank(c6, pool)
        }
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[C6 Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { C6Esteira }
async function verifyFaseBank(c6, pool) {
  if (queue <= 0) return console.log(`[C6 Esteira]=> Finalizado!`);
  var proposta = queue[0].proposta
  if (proposta.CodFase == 4) {
    if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
    return verifyFase(facta, pool)
  }
  const getProposta = await c6.getProposta(proposta.NumeroContrato, { af: "C6 ESTEIRA" })
  if (getProposta && getProposta.data) {
    if (getProposta.data.loan_track && getProposta.data.loan_track.current_activity_description) {
      var fases = [
        { situacao: 'INT', atividade: 'PAGO', status: [
          { status: '409', fase: '3920', faseName: 'PROPOSTA PAGA', motivo: '', oldFase: ['2','4002','9232', '9923', '692'] }, //CONCLUIDO
        ]},
        { situacao: 'PEN', atividade: 'AGUARDA FORM DIG WEB', status: [
          { status: '476', fase: '10293', faseName: 'Verificação manual OP', motivo: 'Verificar se o cliente já assinou ou está aguardando envio do documento', oldFase: ['2','4002','692'] }, //NÃO INICIADO //AGUARDANDO ENVIO DOC
          //{ status: '476', fase: '9', faseName: 'PENDENTE', motivo: 'Favor anexar doc frente e verso do cliente', oldFase: ['2'] }, //AGUARDANDO ENVIO DOC
          { status: '480', fase: '9', faseName: 'PENDENTE', motivo: 'Favor anexar doc frente e verso do cliente', oldFase: ['2','4002','9','9232'] }, //PENDENTE DOCUMENTOS
          { status: '683', fase: '10293', faseName: 'Verificação manual OP', motivo: 'Aguardando Selfie', oldFase: ['2','4002','692'] }, //PENDENTE DOCUMENTOS
        ]},
        { situacao: 'AND', atividade: 'ANALISE DOCUMENTAL', status: [
          { status: '422', fase: '692', faseName: 'PROPOSTA EM ANALISE BANCO', motivo: 'Banco esta analisando os documentos do cliente!', oldFase: ['2','4002','9','9232'] }, //CONCLUIDO
        ]},
        { situacao: 'AND', atividade: 'ANALISE SELFIE', status: [
          { status: '704', fase: '692', faseName: 'PROPOSTA EM ANALISE BANCO', motivo: 'Banco esta analisando a selfie do cliente!', oldFase: ['2','4002','9','9232'] }, //CONCLUIDO
        ]},
        { situacao: 'AND', atividade: 'EM AVERBACAO', status: [
          { status: '384', fase: '10293', faseName: 'Verificação manual OP', motivo: 'Proposta em averbação, OP VERIFICAR', oldFase: [] }, //CONCLUIDO
        ]},
        { situacao: 'PEN', atividade: 'AJUSTAR MARGEM', status: [
          { status: '14', fase: '10293', faseName: 'Verificação manual OP', motivo: 'Proposta em ajustar margem, OP VERIFICAR', oldFase: [] }, //CONCLUIDO
        ]},
        { situacao: 'PEN', atividade: 'AGUARDA AUTORIZACAO', status: [
          { status: '19', fase: '9', faseName: 'PENDENTE', motivo: 'Cliente cancelou a autorização! Favor solicitar para o mesmo gerar novamente para seguirmos com a operação!', oldFase: [] }, //CONCLUIDO
        ]},
        { situacao: 'PEN', atividade: 'ANALISE CORBAN', status: [
          { status: '105', fase: '1111', faseName: 'AGUARDANDO ATUAÇÃO MASTER', motivo: '', oldFase: ['2','4002','9','9232'] }, //CONCLUIDO
        ]},
        { situacao: 'PEN', atividade: 'PEN DOCUMENTOS', status: [
          { status: '404', fase: '9', faseName: 'PENDENTE', motivo: 'Favor anexar documentos do cliente! E avisar o mesmo, que o banco pode entrar em contato pelo telefone cadastrado!', oldFase: [] }, //CONCLUIDO
        ]},
        { situacao: 'AND', atividade: 'MESA PREVENCAO', status: [
          { status: '221', fase: '9', faseName: 'PENDENTE', motivo: 'Banco esta analisando a proposta e pode entrar em contato com o cliente! Informar o mesmo sobre o possivel contato', oldFase: ['692','2','4002' ] }, //CONCLUIDO
          { status: '222', fase: '9', faseName: 'PENDENTE', motivo: 'Banco esta analisando a proposta e pode entrar em contato com o cliente! Informar o mesmo sobre o possivel contato', oldFase: ['692','2','4002' ] }, //CONCLUIDO
        ]},
        { situacao: 'REP', atividade: 'REPROVA FGTS', status: [
          { status: '958', fase: '12', faseName: 'Pendência Resolvida', motivo: '', oldFase: [] }, //CANCELADO
        ]},
        { situacao: 'REP', atividade: 'REPROVA CREDITO', status: [
          { status: '955', fase: '12', faseName: 'Pendência Resolvida', motivo: '', oldFase: [] }, //CANCELADO
        ]},
      ]
      var faseObject = fases.find(r=> r.situacao == getProposta.data.loan_track.situation && r.atividade == getProposta.data.loan_track.current_activity_description) 
      if (faseObject && faseObject.status && faseObject.status.length >= 1) {
        if (faseObject.status.find(r=>r.status == getProposta.data.loan_track.current_activity_number)) {
          var fase = faseObject.status.find(r=>r.status == getProposta.data.loan_track.current_activity_number && (r.oldFase.length <= 0 || r.oldFase.find(r2=> r2 == proposta.CodFase)))
          if (fase) {
            if (proposta.CodFase != fase.fase) {
              await pool.request()
                .input('contrato',proposta.NumeroContrato)
                .input('fase',fase.fase)
                .input('bank',626)
                .input('texto',`[ESTEIRA]=> Fase alterada para a mesma que está no banco: ${fase.faseName}!${fase.motivo.length >= 1 ? queue[0].fase == 1 ? '\nMotivo: '+fase.motivo+' OP. vai refazer o cadastro...' : '\nMotivo: '+fase.motivo : ''}`)
                .execute('pr_changeFase_by_contrato');
              //console.log(`[C6 Esteira]=> Contrato: ${proposta.NumeroContrato} - FaseOLD: ${proposta.Fase} - FaseNew: ${fase.faseName} ${fase.motivo.length >= 1 ? queue[0].fase == 1 ? '\nMotivo: '+fase.motivo+' OP. vai refazer o cadastro...' : '\nMotivo: '+fase.motivo : ''}`)
            }
          }
        } else console.log(`[C6 Esteira ${proposta.NumeroContrato}] => Novo Status - Situação: ${getProposta.data.loan_track.situation} - Atividade: ${getProposta.data.loan_track.current_activity_description} - Status: ${getProposta.data.loan_track.current_activity_number}`)
      } else console.log(`[C6 Esteira  ${proposta.NumeroContrato}] => Nova Atividade - Situação: ${getProposta.data.loan_track.situation} - Atividade: ${getProposta.data.loan_track.current_activity_description} - Status: ${getProposta.data.loan_track.current_activity_number}`)
    }
  }
  if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
  return verifyFaseBank(c6, pool)
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }