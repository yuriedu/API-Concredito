const BMG = require('../../APIs/BMG');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");









const BMGCART = async (cliente) => {
  try {
    var client = await dadosCliente(cliente, "INSS");
    if (client && client.status) {
      client = client.dados
      var date = client.Datanascimento.toISOString().slice(0, 10)
      var ano = date.slice(0,4)
      var mes = date.slice(5,7)
      var dia = date.slice(8,10)
      var telefone = cliente.TelefoneConvenio.replace(cliente.TelefoneConvenio.slice(0,5), "").replace('-','')
      var naturalidadeCode = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

      var code1 = `var allInputs = document.getElementsByTagName("input");
for (var i = 0, n = allInputs.length; i < n; ++i) {
  var input = allInputs[i];
  if (input.id) {
    if (input.id.includes('j_idt') && input.id.includes('find:txt-value')) {
      document.getElementById(input.id).value = '4277'
      document.getElementById(input.id).onchange()
    }
    setTimeout(()=>{
      var allInputs = document.getElementsByTagName("input");
      for (var i = 0, n = allInputs.length; i < n; ++i) {
        var input = allInputs[i];
        if (input.id.includes('cpf')) document.getElementById(input.id).value = '${client.Cpf}'
        if (input.id.includes('matricula')) document.getElementById(input.id).value = '${client.Maatricula.replace(".","").replace(".","").replace("-","")}'
        if (input.id.includes('dataDeNascimento')) document.getElementById(input.id).value = '${dia}/${mes}/${ano}'
      }
    }, 1000)
  }
}`



      var code2 = `var allInputs = document.getElementsByTagName("*");
for (var i = 0, n = allInputs.length; i < n; ++i) {
  var input = allInputs[i];
  if (input.id && (input.tagName == "INPUT" || input.tagName == "SELECT")) {
    if (input.id.includes('uf_conta_beneficiaria')) document.getElementById(input.id).value = '${client.UF}'
    if (input.id.includes('data_nascimento')) document.getElementById(input.id).value = '${dia}/${mes}/${ano}'
    if (input.id.includes('data_renda')) document.getElementById(input.id).value = '01/07/2022'
    if (input.id.includes('desconto_compulsorio')) document.getElementById(input.id).value = '1,00'
    if (input.id.includes('desconto_compulsorio')) document.getElementById(input.id).onchange()
    if (input.id.includes('valor_renda')) document.getElementById(input.id).value = String('${client.ValorParcela / 5 * 100 + 3}').replace(".",",")
    if (input.id.includes('valor_renda')) document.getElementById(input.id).onchange()
    if (input.id.includes('j_idt2') && input.id.includes('find:txt-value')) document.getElementById(input.id).value = '${client.Especie}'
    if (input.id.includes('j_idt2') && input.id.includes('find:txt-value')) document.getElementById(input.id).onchange()
    if (input.id.includes('grau_instrucao')) document.getElementById(input.id).value = '7'
    if (input.id.includes('cep:txt-value')) document.getElementById(input.id).value = '${client.Cep}'
    if (input.id.includes('cep:txt-value')) document.getElementById(input.id).onchange()
    //TIMEOUT(1)
    if (input.id.includes('dddCelular1')) document.getElementById(input.id).value = '${client.TelefoneConvenio.substr(1, 2)}'
    if (input.id.includes('celular1')) document.getElementById(input.id).value = '9${telefone.replace(telefone.slice(8,telefone.length),"")}'
    if (input.id.includes('tipo_de_saque')) document.getElementById(input.id).value = 'SAQUE_AUTORIZADO'
    if (input.id.includes('tipo_de_saque')) document.getElementById(input.id).onchange()
    //TIMEOUT(2)
    if (input.id.includes('forma_de_credito')) {
      if ('${client.CodBancoCliente}' == 318) {
        if (document.getElementById(input.id).options[1].text == 'Conta BMG') document.getElementById(input.id).value = 1
        if (document.getElementById(input.id).options[2].text == 'Conta BMG') document.getElementById(input.id).value = 2
        if (document.getElementById(input.id).options[3].text == 'Conta BMG') document.getElementById(input.id).value = 3
      } else {
        if (document.getElementById(input.id).options[1].text == 'TRANSFERÊNCIA BANCÁRIA') document.getElementById(input.id).value = 1
        if (document.getElementById(input.id).options[2].text == 'TRANSFERÊNCIA BANCÁRIA') document.getElementById(input.id).value = 2
        if (document.getElementById(input.id).options[3].text == 'TRANSFERÊNCIA BANCÁRIA') document.getElementById(input.id).value = 3
      }
      document.getElementById(input.id).onchange()
    }
    //TIMEOUT(3)
    if (input.id.includes('nome')) document.getElementById(input.id).value = '${client.NomeCliente}'
    if (input.id.includes('sexo')) document.getElementById(input.id).value = '${client.sexo == "F" ? 2 : 1}'
    if (input.id.includes('estado_civil')) document.getElementById(input.id).value = '5'
    if (input.id.includes('nome_mae')) document.getElementById(input.id).value = '${client.NomeMae}'
    if (input.id.includes('nome_pai')) document.getElementById(input.id).value = '${client.NomePai}'
    if (input.id.includes('j_idt') && input.id.includes('selecionaUf')) document.getElementById(input.id).value = '${naturalidadeCode.findIndex(r=>r==client.UF) + 1}'
    if (input.id.includes('j_idt') && input.id.includes('selecionaUf')) document.getElementById(input.id).onchange()
    //TIMEOUT(4)
    if (input.id.includes('nacionalidade')) document.getElementById(input.id).value = 'BRASILEIRA'
    if (input.id.includes('tipo_documento_identificacao')) document.getElementById(input.id).value = 'Carteira de Identidade'
    if (input.id.includes('numero_identidade')) document.getElementById(input.id).value = '${client.rg}'
    if (input.id.includes('emissor')) document.getElementById(input.id).value = 'SSP'
    if (input.id.includes('uf_identidade:selecionaUf')) document.getElementById(input.id).value = '${naturalidadeCode.findIndex(r=>r==client.UF) + 1}'
    if (input.id.includes('data_emissao_identidade')) document.getElementById(input.id).value = '01/01/2001'
    //TIMEOUT(5)
    setTimeout(()=>{
      var allInputs = document.getElementsByTagName("*");
      for (var i = 0, n = allInputs.length; i < n; ++i) {
        var input = allInputs[i];
        if (input.id && (input.tagName == "INPUT" || input.tagName == "SELECT")) {
        //TIMEOUT(1)
          if (input.id.includes('logradouro')) document.getElementById(input.id).value = '${client.Endereco}'
          if (input.id.includes('numeroLogradoruro')) document.getElementById(input.id).value = '${client.EndNumero}'
          if (input.id.includes('bairro')) document.getElementById(input.id).value = '${client.Bairro}'
        //TIMEOUT(2)
          if (input.id.includes('valor_saque') && document.getElementById('valor_saque_maximo')) document.getElementById(input.id).value = document.getElementById('valor_saque_maximo').innerHTML.replace(".","")
          if (input.id.includes('valor_saque')) document.getElementById(input.id).onchange()
        //TIMEOUT(3)
          if ('${client.CodBancoCliente}' != 318) {
            if (input.id.includes('j_idt5') && input.id.includes('find:txt-value')) document.getElementById(input.id).value = '${client.CodBancoCliente}'
            if (input.id.includes('j_idt5') && input.id.includes('find:txt-value')) document.getElementById(input.id).onchange()
            if (input.id.includes('findAgencia')) document.getElementById(input.id).value = '${client.Agencia}'
            if (input.id.includes('findAgencia')) document.getElementById(input.id).onchange()
          }
          //TIMEOUT[2](1)
        //TIMEOUT(4)
          if (input.id.includes('naturalidade_input')) document.getElementById(input.id).value = '${client.Cidade.toUpperCase()}'
          if (input.id.includes('naturalidade_hinput')) document.getElementById(input.id).value = '${client.Cidade.toUpperCase()}'
        //TIMEOUT(5)
          if (input.id.includes('seleciona_forma_envio')) document.getElementById(input.id).value = 'BIOMETRIA_REMOTA_APP'
          setTimeout(()=>{
            var allInputs = document.getElementsByTagName("*");
            for (var i = 0, n = allInputs.length; i < n; ++i) {
              var input = allInputs[i];
              if (input.id && (input.tagName == "INPUT" || input.tagName == "SELECT")) {
              //TIMEOUT[2](1)
                if (input.id.includes('finalidade_credito')) document.getElementById(input.id).value = '${cliente.Poupanca ? 2 : 1}'
                if (input.id.includes('numero_conta')) document.getElementById(input.id).value = '${client.ContaCorrente.slice(0, client.ContaCorrente.length-1).replace("-","")}'
                if (input.id.includes('digito_conta')) document.getElementById(input.id).value = '${client.ContaCorrente.slice(client.ContaCorrente.length-1, client.ContaCorrente.length)}'
                if (input.id.includes('motivos_pagamento_outra_conta_ted')) document.getElementById(input.id).value = '1'
                if (input.id.includes('motivos_pagamento_outra_conta_ted')) document.getElementById(input.id).onchange()
              }
            }
          }, 2000)
        }
      }
    }, 2000)
  }
}`

      return { status: true, code1: code1, code2: code2 }
      } else return { status: false, error: client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...' }
  } catch(err) {
    console.log(`[BMG GENERATOR CARD ERROR] => ${err}`)
    console.log(err)
    return { status: false, error: '[0]=> Ocorreu algum erro no meu codigo! REPORTE AO YURI...' }
  }
}

module.exports = { BMGCART }