const C6 = require('../../APIs/C6');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString, validateBanck } = require('../../Utils/functions');

const C6FGTS = async (cpf, type, valor, log) => {
  try {
    const c6 = await new C6();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await c6.refreshToken(log)
    if (loadAPI) {
      var data = {
        tax_identifier: cpf,
        birth_date: '1967-08-10',
        federation_unit: "RS",
        simulation_type: type,
        formalization_subtype:"DIGITAL_WEB",
        table_code: process.env.C6_TABLE,
        promoter_code: process.env.C6_PROMOTER
      }
      if (type == "POR_VALOR_SOLICITADO") data.requested_amount = Number(valor)
      if (type == "POR_QUANTIDADE_DE_PARCELAS") data.installment_quantity = Number(valor)
      const simularProposta = await c6.simularProposta(data, log);
      if (simularProposta && simularProposta.data) {
        if (simularProposta.data.net_amount) {
          if (parseFloat(simularProposta.data.net_amount) - client.Valor > client.Valor*0.05) return { status: false, error: `[2]=> Valor simulado é mais de 5% menor que o proposto ao cliente! Altere o valor e tente novamente... Valor da simulação: ${simularProposta.data.net_amount}` }
          //console.log(simularProposta.data)
        } else {
          if (simularProposta.data.details && simularProposta.data.details) return { status: false, error: `[3]=> ${simularProposta.data.details[0] ? simularProposta.data.details[0] : simularProposta.data.details}` }
          if (simularProposta.data.message) return { status: false, error: `[4]=> ${simularProposta.data.message}` }
          console.log(`[C6 Consultas FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
          console.log(simularProposta.data)
          return { status: false, error: `[5]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...` }
        }
      } else return { status: false, error: `[6]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...` }
    } else return { status: false, error: `[7]=> Problema na conexão da API! Tente novamente mais tarde...` }
  } catch(err) {
    console.log(`[C6 Consultas FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { C6FGTS }