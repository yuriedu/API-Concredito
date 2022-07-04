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
        if (simularProposta.data.net_amount && simularProposta.data.gross_amount) {
          if (type == "POR_VALOR_SOLICITADO" && valor && parseFloat(simularProposta.data.net_amount) - valor > valor*0.05) return { status: false, error: `[7]=> Valor simulado é mais de 5% menor que o proposto ao cliente! Altere o valor e tente novamente... Valor da simulação: ${simularProposta.data.net_amount}` }
          var ano = simularProposta.data.base_date.slice(0,4)
          var mes = simularProposta.data.base_date.slice(5,7)
          var dia = simularProposta.data.base_date.slice(8,10)
          var data = {
            status: true,
            cpf: cpf,
            saldoLiberado: `R$ ${String(simularProposta.data.net_amount).replace('.',',')}`,
            saldoTotal: `R$ ${String(simularProposta.data.gross_amount).replace('.',',')}`,
            data: `${dia}/${mes}/${ano}`,
            parcelas: [],
          }
          await simularProposta.data.installments.forEach((parc)=>{
            var ano = parc.due_date.slice(0,4)
            var mes = parc.due_date.slice(5,7)
            var dia = parc.due_date.slice(8,10)
            data.parcelas[data.parcelas.length] = { data: `${dia}/${mes}/${ano}`, valor: `R$ ${String(parc.amount).replace('.',',')}` }
          })
          return data;
        } else {
          if (simularProposta.data.details && simularProposta.data.details.length >= 0) return { status: false, error: `[6]=> ${simularProposta.data.details[0]}` }
          if (!Array.isArray(simularProposta.data.details)) return { status: false, error: `[5]=> ${simularProposta.data.details}` }
          if (simularProposta.data.message) return { status: false, error: `[4]=> ${simularProposta.data.message}` }
          console.log(`[C6 Consultas FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
          console.log(simularProposta.data)
          return { status: false, error: `[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...` }
        }
      } else return { status: false, error: `[2]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...` }
    } else return { status: false, error: `[1]=> Problema na conexão da API! Tente novamente mais tarde...` }
  } catch(err) {
    console.log(`[C6 Consultas FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { C6FGTS }