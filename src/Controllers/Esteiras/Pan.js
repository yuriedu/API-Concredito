const Pan = require('../../APIs/Pan');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []

const PanEsteira = async (pool, log) => {
  try {
    console.log('[Pan Esteira]=> Iniciando...')
    const pan = await new Pan();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await pan.refreshToken(log)
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
      const propostas = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',623).execute('pr_getPropostas_by_Bank_and_Date')
      propostas.recordset.forEach((proposta, index)=>{
        queue[queue.length] = { codigo: proposta.NumeroContrato, proposta: proposta }
        if (queue.length == 1) return verifyFaseBank(pan, pool)
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Pan Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { PanEsteira }

async function verifyFaseBank(pan, pool) {
  await timeout(3000)
  if (queue <= 0) return console.log(`[Pan Esteira]=> Finalizado!`);
  var proposta = queue[0].proposta
  const getContrato = await pan.getContrato('02499276088', { af: "PAN ESTEIRA" })
  // const getContrato = await pan.getContrato(proposta.Cpf, { af: "PAN ESTEIRA" })
  if (getContrato && getContrato.data) {
    if (getContrato.data) {
      console.log(getContrato.data)
    } else {
      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyFaseBank(pan, pool)
    }
  } else {
    if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
    return verifyFaseBank(pan, pool)
  }
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }