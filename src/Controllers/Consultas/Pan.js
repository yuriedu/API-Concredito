const Pan = require('../../APIs/Pan');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');

const PanFGTS = async (cpf, type, valor, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    const pan = await new Pan();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await pan.refreshToken(log)
    if (loadAPI) {
      const data = {
        cpf_cliente: cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
        codigo_promotora: process.env.PAN_PROMOTER_CODE
      };
      if (type == 'POR_VALOR_SOLICITADO') data.valor_solicitado = valor
      const simularProposta = await pan.simularProposta(data, log);
      if (simularProposta && simularProposta.data) {
        if (simularProposta.data[0] && simularProposta.data[0].condicoes_credito) {
          
          console.log(simularProposta.data[0])

        } else {
          if (simularProposta.data.detalhes) return { status: false, error: `[5]=> ${simularProposta.data.detalhes[0] ? simularProposta.data.detalhes[0] : simularProposta.data.detalhes}` }
          console.log(`[Pan FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
          console.log(simularProposta.data)
          return { status: false, error: '[4]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
        }
      } else return { status: false, error: '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
    } else return { status: false, error: '[2]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Pan FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { PanFGTS }