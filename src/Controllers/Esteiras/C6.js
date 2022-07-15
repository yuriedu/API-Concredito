const C6 = require('../../APIs/C6');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');

var queue = []

const C6Esteira = async (pool, log) => {
  try {
    const c6 = await new C6();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await c6.refreshToken(log)
    if (loadAPI) {
      const propostas = await pool.request().input('date', new Date('2022-07-8 00:00:00')).input('bank',626).execute('pr_getPropostas_by_Bank_and_Date')
      console.log(propostas.recordset.length)
      propostas.recordset.forEach((proposta, index)=>{
        queue[queue.length] = { codigo: proposta.NumeroContrato, proposta: proposta }
        if (queue.length == 1) return verifyFaseBank(c6, pool)
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[C6 Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { C6Esteira }

async function verifyFaseBank(c6, pool) {
  await timeout(3000)
  if (queue <= 0) return;
  var proposta = queue[0].proposta
  console.log(proposta.NumeroContrato)
  const getProposta = await c6.getProposta(proposta.NumeroContrato, { af: "ESTEIRA" })
  if (getProposta && getProposta.data) {
    if (getProposta.data.loan_track && getProposta.data.loan_track.current_activity_description) {
      if (getProposta.data.loan_track.current_activity_description.includes('AGUARDA FORM DIG WEB') || getProposta.data.loan_track.current_activity_description.includes('ANALISE CORBAN')) {
        var fase = 0
        if (proposta.CodFase != 9232 && getProposta.data.loan_track.current_activity_description.includes('AGUARDA FORM DIG WEB')) fase = 9232 //AGUARDANDO ASSINATURA DIGITAL
        if (proposta.CodFase != 1111 && getProposta.data.loan_track.current_activity_description.includes('ANALISE CORBAN')) fase = 1111 //AGUARDANDO ATUAÇÃO MASTER
        
        if (proposta.CodFase != 9232 && getProposta.data.loan_track.current_activity_description.includes('AGUARDA FORM DIG WEB')) fase = 9232 //AGUARDANDO ASSINATURA DIGITAL


        
        console.log(getProposta.data.loan_track)
      } else console.log(getProposta.data.loan_track)





      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyFaseBank(c6, pool)
    } else {
      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyReason(facta, pool)
    }
  } else {
      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyReason(facta, pool)
  }
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }