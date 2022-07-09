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
      var page1 = `if (document.getElementById('identificacao-form:j_idt27:find:txt-value')) { document.getElementById('identificacao-form:j_idt27:find:txt-value').value = '4277' } else { document.getElementById('identificacao-form:j_idt27:find:txt-value').value = '4277' }\n`
      page1 += `document.getElementById('identificacao-form:j_idt27:find:txt-value').onchange()\n`
      page1 += `setTimeout(()=>{\n`
        page1 += `  document.getElementById('identificacao-form:cpf').value = '${client.Cpf}'\n`
        page1 += `  document.getElementById('identificacao-form:matricula').value = '${client.Maatricula}'\n`
        page1 += `  document.getElementById('identificacao-form:dataDeNascimento').value = '${dia}/${mes}/${ano}'\n`
      page1 += `}, 1000)`

      var page2 = `document.getElementById('uf_conta_beneficiaria').value = '${client.UF}'\n`
      page2 += `document.getElementById('data_nascimento').value = '${dia}/${mes}/${ano}'\n`
      page2 += `document.getElementById('data_renda').value = '${moment(new Date(), 'DD/MM/YYYY').format('DD-MM-YYYY').replace("-","/").replace("-","/")}'\n`
      page2 += `document.getElementById('valor_renda').value = '${client.ValorParcela / 5 * 100 + 3}'\n`
      page2 += `document.getElementById('valor_renda').onchange()\n`
      page2 += `if (document.getElementById('j_idt226:find:txt-value')) { document.getElementById('j_idt226:find:txt-value').value = '${client.Especie}' } else { document.getElementById('j_idt221:find:txt-value').value = '${client.Especie}' }`
      page2 += `if (document.getElementById('j_idt226:find:txt-value')) { document.getElementById('j_idt226:find:txt-value').onchange() } else { document.getElementById('j_idt221:find:txt-value').onchange() }`
      page2 += `document.getElementById('grau_instrucao').value = '7'\n`
      page2 += `document.getElementById('cep:txt-value').value = '${client.Cep}'\n`
      page2 += `document.getElementById('cep:txt-value').onchange()\n`
      page2 += `setTimeout(()=>{\n`
        page2 += `  document.getElementById('logradouro').value = '${client.Endereco}'\n`
        page2 += `  document.getElementById('numeroLogradoruro').value = '${client.EndNumero}'\n`
        page2 += `  document.getElementById('bairro').value = '${client.Bairro}'\n`
      page2 += `}, 2000)\n`
      page2 += `document.getElementById('dddCelular1').value = '${client.TelefoneConvenio.substr(1, 2)}'\n`
      page2 += `document.getElementById('celular1').value = '9${telefone.replace(telefone.slice(8,telefone.length),"")}'\n`
      page2 += `document.getElementById('tipo_de_saque').value = 'SAQUE_AUTORIZADO'\n`
      page2 += `document.getElementById('tipo_de_saque').onchange()\n`
      page2 += `setTimeout(()=>{\n`
        page2 += `  document.getElementById('valor_saque').value = document.getElementById('valor_saque_maximo').innerHTML.replace(".","")\n`
        page2 += `  document.getElementById('valor_saque').onchange()\n`
      page2 += `}, 1000)\n`
      page2 += "document.getElementById('forma_de_credito').value = `${document.getElementById('forma_de_credito').options[1].text == 'TRANSFERÊNCIA BANCÁRIA' ? 1 : document.getElementById('forma_de_credito').options[2].text == 'TRANSFERÊNCIA BANCÁRIA' ? 2 : 3}`\n"
      page2 += `document.getElementById('forma_de_credito').onchange()\n`
      page2 += `setTimeout(()=>{\n`
        page2 += `  if (document.getElementById('j_idt598:find:txt-value')) { document.getElementById('j_idt598:find:txt-value').value = '${client.CodBancoCliente}' } else { document.getElementById('j_idt593:find:txt-value').value = '${client.CodBancoCliente}' }\n`
        page2 += `  if (document.getElementById('j_idt598:find:txt-value')) { document.getElementById('j_idt598:find:txt-value').onchange() } else { document.getElementById('j_idt593:find:txt-value').onchange() }\n`
        page2 += `  document.getElementById('findAgencia:find:txt-value').value = '${client.Agencia}'\n`
        page2 += `  document.getElementById('findAgencia:find:txt-value').onchange()\n`
        page2 += `  setTimeout(()=>{\n`
          page2 += `    document.getElementById('finalidade_credito').value = '${cliente.Poupanca ? 2 : 1}'\n`
          page2 += `    document.getElementById('numero_conta').value = '${client.ContaCorrente.slice(0, client.ContaCorrente.length-1)}'\n`
          page2 += `    document.getElementById('digito_conta').value = '${client.ContaCorrente.slice(client.ContaCorrente.length-1, client.ContaCorrente.length)}'\n`
          page2 += `    document.getElementById('motivos_pagamento_outra_conta_ted').value = '1'\n`
          page2 += `    document.getElementById('motivos_pagamento_outra_conta_ted').onchange()\n`
        page2 += `  }, 1000)\n`
      page2 += `}, 2000)\n`
      page2 += `document.getElementById('nome').value = '${client.NomeCliente}'\n`
      page2 += `document.getElementById('sexo').value = '${client.sexo == "F" ? 2 : 1}'\n`
      page2 += `document.getElementById('estado_civil').value = '5'\n`
      page2 += `document.getElementById('nome_mae').value = '${client.NomeMae}'\n`
      page2 += `document.getElementById('nome_pai').value = '${client.NomePai}'\n`
      page2 += `if (document.getElementById('j_idt787:selecionaUf')) { document.getElementById('j_idt787:selecionaUf').value = '${naturalidadeCode.findIndex(r=>r==client.UF) + 1}' } else { document.getElementById('j_idt782:selecionaUf').value = '${naturalidadeCode.findIndex(r=>r==client.UF) + 1}' }\n`
      page2 += `if (document.getElementById('j_idt787:selecionaUf')) { document.getElementById('j_idt787:selecionaUf').onchange() } else { document.getElementById('j_idt782:selecionaUf').onchange() }\n`
      page2 += `setTimeout(()=>{\n`
        page2 += `  document.getElementById('naturalidade_input').value = '${client.Cidade.toUpperCase()}'\n`
        page2 += `  document.getElementById('naturalidade_hinput').value = '${client.Cidade.toUpperCase()}'\n`
      page2 += `}, 2000)\n`
      page2 += `document.getElementById('nacionalidade').value = 'BRASILEIRA'\n`
      page2 += `document.getElementById('tipo_documento_identificacao').value = 'Carteira de Identidade'\n`
      page2 += `document.getElementById('numero_identidade').value = '${client.rg}'\n`
      page2 += `document.getElementById('emissor').value = '${client.OrgaoEmissor}'\n`
      page2 += `document.getElementById('uf_identidade:selecionaUf').value = '${naturalidadeCode.findIndex(r=>r==client.UF) + 1}'\n`
      page2 += `document.getElementById('data_emissao_identidade').value = '01/01/2001'\n`
      page2 += `setTimeout(()=>{\n`
        page2 += `  document.getElementById('seleciona_forma_envio').value = 'BIOMETRIA_REMOTA_APP'\n`
      page2 += `}, 2000)`
      return { status: true, code1: page1, code2: page2 }
      } else return { status: false, error: client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...' }
  } catch(err) {
    console.log(`[BMG GENERATOR CARD ERROR] => ${err}`)
    console.log(err)
    return { status: false, error: '[0]=> Ocorreu algum erro no meu codigo! REPORTE AO YURI...' }
  }
}

module.exports = { BMGCART }