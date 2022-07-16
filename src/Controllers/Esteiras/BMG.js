const BMG = require('../../APIs/BMG');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []

const BMGEsteira = async (pool, log) => {
  try {
    const bmg = await new BMG();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await bmg.refreshToken(log)
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
      const propostas = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',318).execute('pr_getPropostas_by_Bank_and_Date')
      propostas.recordset.forEach((proposta, index)=>{
        queue[queue.length] = { codigo: proposta.NumeroContrato, proposta: proposta }
        if (queue.length == 1) return verifyFaseBank(bmg, pool)
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[BMG Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { BMGEsteira }

async function verifyFaseBank(bmg, pool) {
  await timeout(3000)
  if (queue <= 0) return console.log(`[BMG Esteira]=> Finalizado!`);
  var proposta = queue[0].proposta
  const getProposta = await bmg.getProposta(proposta.NumeroContrato, { af: "BMG ESTEIRA" })
  if (getProposta && getProposta.data) {
    if (getProposta.data.loan_track && getProposta.data.loan_track.current_activity_description) {

      if (fase && faseName) {

      } else{

      }
      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyFaseBank(bmg, pool)
    } else {
      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyFaseBank(bmg, pool)
    }
  } else {
    if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
    return verifyFaseBank(bmg, pool)
  }
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }