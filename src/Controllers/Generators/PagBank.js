const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

const PagBankINSS = async (cliente) => {
  try {
    var client = await dadosCliente(cliente, "INSS");
    if (client && client.status) {
      client = client.dados
      var date = client.Datanascimento.toISOString().slice(0, 10)
      var ano = date.slice(0,4)
      var mes = date.slice(5,7)
      var dia = date.slice(8,10)
      var code1 = `var allInputs = document.getElementsByTagName("*");
for (var i = 0, n = allInputs.length; i < n; ++i) {
  var input = allInputs[i];
  if (input.id && (input.tagName == "INPUT" || input.tagName == "SELECT")) {
    if (input.id.includes('DadosIniciais') && input.id.includes('TipoOperacao_CAMPO')) {
      document.getElementById(input.id).value = 'Portabilidade'
      setTimeout('__doPostBack(\'ctl00$Cph$UcPrp$FIJN1$JnDadosIniciais$UcDIni$cboTipoOperacao$CAMPO\',\'\')', 0)
    }
    // if (input.id.includes('DadosIniciais') && input.id.includes('CPF')) {
    //   document.getElementById(input.id).value = '${cliente.Cpf}'
    //   if (document.getElementById(input.id).onchange) document.getElementById(input.id).onchange()
    // }
  }
}`

      return { status: true, code1: code1 }
    } else return { status: false, error: client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...' }
  } catch(err) {
    console.log(`[BMG GENERATOR CARD ERROR] => ${err}`)
    console.log(err)
    return { status: false, error: '[0]=> Ocorreu algum erro no meu codigo! REPORTE AO YURI...' }
  }
}

module.exports = { PagBankINSS }