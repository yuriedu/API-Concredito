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
      var agilus = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',626).execute('pr_getPropostas_by_Bank_and_Date')
      agilus.recordset = agilus.recordset.filter(r=> r.NumeroContrato && r.NumeroContrato != 0)
      propostas.recordset.forEach((proposta, index)=>{
        var fases = [
          { situacao: 'INT', atividade: 'PAGO', status: {
            '409': { newFase: '3920', oldFase: ['2','4002','9232', '9923', '692'] }, //CONCLUIDO
          }},
          { situacao: 'AND', atividade: 'ANALISE DOCUMENTAL', status: {
            '422': { newFase: '692', oldFase: ['2','4002','9','9232'], motivo: 'Banco esta analisando os documentos do cliente!' }, //CONCLUIDO
          }},
          { situacao: 'AND', atividade: 'ANALISE SELFIE', status: {
            '704': { newFase: '692', oldFase: ['2','4002','9','9232'], motivo: 'Banco esta analisando os documentos a selfie do cliente!' }, //CONCLUIDO
          }},
          { situacao: 'AND', atividade: 'EM AVERBACAO', status: {
            '384': { newFase: '10293', motivo: 'Proposta em averbação, OP VERIFICAR' }, //CONCLUIDO
          }},
          { situacao: 'PEN', atividade: 'AJUSTAR MARGEM', status: {
            '14': { newFase: '10293', motivo: 'Proposta em ajustar margem, OP VERIFICAR' }, //CONCLUIDO
          }},
          { situacao: 'PEN', atividade: 'AGUARDA AUTORIZACAO', status: {
            '19': { newFase: '9', motivo: 'Cliente cancelou a autorização! Favor solicitar para o mesmo gerar novamente para seguirmos com a operação!' }, //CONCLUIDO
          }},
          { situacao: 'PEN', atividade: 'ANALISE CORBAN', status: {
            '105': { newFase: '1111', oldFase: ['2','4002','9','9232'] }, //CONCLUIDO
          }},
          { situacao: 'PEN', atividade: 'AGUARDA FORM DIG WEB', status: {
            '476': { newFase: '1111', oldFase: ['2','4002','692'], motivo: 'Verificar se o cliente já assinou ou está aguardando envio do documento' }, //NÃO INICIADO //AGUARDANDO ENVIO DOC
            '480': { newFase: '9', oldFase: ['2','4002','9','9232'], motivo: 'Favor anexar doc frente e verso do cliente' }, //PENDENTE DOCUMENTOS
            //'683': { newFase: '683', oldFase: ['2','4002','692'], motivo: 'Verificação manual OP' }, //PENDENTE DOCUMENTOS
          }},
        ]
        //   { situacao: 'PEN', atividade: 'ANALISE CORBAN', status: [
        //     { status: '105', fase: '1111', faseName: 'AGUARDANDO ATUAÇÃO MASTER', motivo: '', oldFase: ['2','4002','9','9232'] }, //CONCLUIDO
        //   ]},
        //   { situacao: 'PEN', atividade: 'PEN DOCUMENTOS', status: [
        //     { status: '404', fase: '9', faseName: 'PENDENTE', motivo: 'Favor anexar documentos do cliente! E avisar o mesmo, que o banco pode entrar em contato pelo telefone cadastrado!', oldFase: [] }, //CONCLUIDO
        //   ]},
        //   { situacao: 'AND', atividade: 'MESA PREVENCAO', status: [
        //     { status: '221', fase: '9', faseName: 'PENDENTE', motivo: 'Banco esta analisando a proposta e pode entrar em contato com o cliente! Informar o mesmo sobre o possivel contato', oldFase: ['692','2','4002' ] }, //CONCLUIDO
        //     { status: '222', fase: '9', faseName: 'PENDENTE', motivo: 'Banco esta analisando a proposta e pode entrar em contato com o cliente! Informar o mesmo sobre o possivel contato', oldFase: ['692','2','4002' ] }, //CONCLUIDO
        //   ]},
        //   { situacao: 'REP', atividade: 'REPROVA FGTS', status: [
        //     { status: '958', fase: '12', faseName: 'Pendência Resolvida', motivo: '', oldFase: [] }, //CANCELADO
        //   ]},
        //   { situacao: 'REP', atividade: 'REPROVA CREDITO', status: [
        //     { status: '955', fase: '12', faseName: 'Pendência Resolvida', motivo: '', oldFase: [] }, //CANCELADO
        //   ]},
        // ]
          queue[queue.length] = { codigo: proposta.NumeroContrato, proposta: proposta }
          if (queue.length == 1) return verifyFaseBank(c6, pool)
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[C6 Esteira ERROR] => ${err}`)
    console.log(err)
  }
}