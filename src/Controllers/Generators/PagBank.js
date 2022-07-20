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
      var dateExpec = client.dataExpedicao.toISOString().slice(0, 10)
      var anoExpec = dateExpec.slice(0,4)
      var mesExpec = dateExpec.slice(5,7)
      var diaExpec = dateExpec.slice(8,10)

var code1 = `var inputs = {}

function timeout(x) { return new Promise(resolve => { setTimeout(() => { resolve(x) }, x) }) }

function getInputs() {
  var allInputs = document.getElementsByTagName("*");
  for (var i = 0, n = allInputs.length; i < n; ++i) {
    var input = allInputs[i];
    //if (input.tagName == "DIV" && input.id && input.id.includes('btnObterMargem') && input.onclick) inputs.obterMargem = input
    if (input.tagName == "A" && input.id && input.id.includes('CompraDivida') && input.id.includes('Incluir') && input.onclick) inputs.incluir = input
    if (input.id && (input.tagName == "INPUT" || input.tagName == "SELECT")) {
      if (input.id.includes('DadosIniciais')) {
        if (input.id.includes('TipoOperacao_CAMPO')) inputs.tipoOperacao = input
        if (input.id.includes('GrupoConvenio_CAMPO')) inputs.grupoConvenio = input
        if (input.id.includes('CPF_CAMPO')) inputs.cpf = input
        if (input.id.includes('DataNascimento_CAMPO')) inputs.nascimento = input
        if (input.id.includes('Matricula_CAMPO')) inputs.matricula = input
        if (input.id.includes('Renda_CAMPO')) inputs.renda = input
      } else if (input.id.includes('CompraDivida')) {
        if (input.id.includes('Banco_CAMPO')) inputs.bancoPort = input
        if (input.id.includes('NrContrato_CAMPO')) inputs.contratoPort = input
        if (input.id.includes('ValorParcela_CAMPO')) inputs.valorParcelaPort = input
        if (input.id.includes('ValorQuitacaoDivida_CAMPO')) inputs.valorPort = input
        if (input.id.includes('QtdeParc_CAMPO')) inputs.parcelasPort = input
        if (input.id.includes('TipoContaBenef_CAMPO')) inputs.tipoContaBenef = input
        if (input.id.includes('BancoBenef_CAMPO')) inputs.bancoBenef = input
        if (input.id.includes('AgenciaBenef_CAMPO')) inputs.agenciaBenef = input
        if (input.id.includes('ContaBenef_CAMPO')) inputs.contaBenef = input
        if (input.id.includes('ContaDVBenef_CAMPO')) inputs.dvBenef = input
      } else if (input.id.includes('DadosCliente')) {
        if (input.id.includes('Nome_CAMPO')) inputs.nome = input
        if (input.id.includes('Sexo_CAMPO')) inputs.sexo = input
        if (input.id.includes('EstadoCivil_CAMPO')) inputs.estadoCivil = input
        if (input.id.includes('Documento_CAMPO')) inputs.rg = input
        if (input.id.includes('DvDocumento_CAMPO')) inputs.rgDV = input
        if (input.id.includes('Emissor_CAMPO')) inputs.emissor = input
        if (input.id.includes('UFDoc_CAMPO')) inputs.clientUF = input
        if (input.id.includes('DataEmissao_CAMPO')) inputs.dataEmissao = input
        if (input.id.includes('Mae_CAMPO')) inputs.mae = input
        if (input.id.includes('Pai_CAMPO')) inputs.pai = input
        if (input.id.includes('DddTelResidencial_CAMPO')) inputs.ddd = input
        if (input.id.includes('TelResidencial_CAMPO')) inputs.telefone = input
        if (input.id.includes('DddTelCelular_CAMPO')) inputs.ddd2 = input
        if (input.id.includes('TelCelular_CAMPO')) inputs.celular = input
        if (input.id.includes('Email_CAMPO')) inputs.email = input
      }
    }
  }
  return true;
}

async function reloadInputs(id, timer) {`+
' setTimeout(`__doPostBack(\'${id}\',\'\')`,0);'+`
  await timeout(timer);
  inputs = {}
  var loadInputs = await getInputs()
  if (loadInputs) return true;
}

async function loadCode() {
  var loadInputs = await getInputs()
  if (loadInputs) {
    if (inputs.tipoOperacao) {
      inputs.tipoOperacao.value = 'Portabilidade';
      await reloadInputs(inputs.tipoOperacao.id, 4000)
      if (inputs.grupoConvenio) {
        inputs.grupoConvenio.value = '5';
        await reloadInputs(inputs.grupoConvenio.id, 5000)
        if (inputs.cpf) {
          inputs.cpf.value = '${client.Cpf}';
          await reloadInputs(inputs.cpf.id, 7000)
          if (inputs.nascimento) {
            inputs.nascimento.value = '${dia}/${mes}/${ano}';
            await reloadInputs(inputs.nascimento.id, 5000)
            if (inputs.matricula) {
              inputs.matricula.value = '${cliente.BeneficioAF ? cliente.BeneficioAF : cliente.Maatricula}';
              await reloadInputs(inputs.matricula.id, 6000)
              if (inputs.renda) {
                inputs.renda.value = '5000';
                await reloadInputs(inputs.renda.id, 6000)
                //BOTAO MARGEM REMOVIDO
                if (inputs.bancoPort) {
                  inputs.bancoPort.value = '${cliente.PortabilidadeBanco}';
                  await reloadInputs(inputs.bancoPort.id, 7000)
                  if (inputs.contratoPort) {
                    inputs.contratoPort.value = '${cliente.PortabilidadeContrato}';
                    await timeout(1000);
                    if (inputs.valorParcelaPort) {
                      inputs.valorParcelaPort.value = '${cliente.PortabilidadePrestacao}';
                      await timeout(1000);
                      if (inputs.valorPort) {
                        inputs.valorPort.value = '${cliente.PortabilidadeValor}';
                        await timeout(1000);
                        if (inputs.parcelasPort) {
                          inputs.parcelasPort.value = '${cliente.PortabilidadeParcelas}';
                          await timeout(1000);
                          if (inputs.tipoContaBenef) {
                            inputs.tipoContaBenef.value = '01';
                            await timeout(1000);
                            if (inputs.bancoBenef) {
                              inputs.bancoBenef.value = '${cliente.PortabilidadeBanco}';
                              await reloadInputs(inputs.bancoBenef.id, 5000)
                              if (inputs.agenciaBenef) {
                                inputs.agenciaBenef.value = '0001';
                                await reloadInputs(inputs.agenciaBenef.id, 5000)
                                if (inputs.contaBenef) {
                                  inputs.contaBenef.value = '12345';
                                  await reloadInputs(inputs.contaBenef.id, 5000)
                                  if (inputs.dvBenef) {
                                    inputs.dvBenef.value = '1';
                                    await reloadInputs(inputs.dvBenef.id, 5000)
                                    if (inputs.incluir) {
                                      inputs.incluir.onclick()
                                      await timeout(5000);

                                      if (inputs.nome) {
                                        inputs.nome.value = '${cliente.NomeCliente}';
                                        await reloadInputs(inputs.nome.id, 5000)
                                        if (inputs.sexo) {
                                          inputs.sexo.value = '${cliente.sexo == "F" ? "Feminino" : "Masculino"}';
                                          await reloadInputs(inputs.sexo.id, 5000)
                                          if (inputs.estadoCivil) {
                                            inputs.estadoCivil.value = 'Solteiro';
                                            await reloadInputs(inputs.estadoCivil.id, 5000)
                                            if (inputs.rg) {
                                              inputs.rg.value = '${cliente.rg.slice(0,cliente.rg.length-1)}';
                                              await reloadInputs(inputs.rg.id, 5000)
                                              if (inputs.rgDV) {
                                                inputs.rgDV.value = '${cliente.rg.slice(cliente.rg.length-1,cliente.rg.length)}';
                                                await reloadInputs(inputs.rgDV.id, 5000)
                                                if (inputs.emissor) {
                                                  inputs.emissor.value = '${cliente.OrgaoEmissor}';
                                                  await reloadInputs(inputs.emissor.id, 5000)
                                                  if (inputs.clientUF) {
                                                    inputs.clientUF.value = '${cliente.OrgaoEmissor}';
                                                    await reloadInputs(inputs.clientUF.id, 5000)
                                                    if (inputs.dataEmissao) {
                                                      inputs.dataEmissao.value = '${diaExpec}/${mesExpec}/${anoExpec}';
                                                      await reloadInputs(inputs.dataEmissao.id, 5000)
                                                      if (inputs.mae) {
                                                        inputs.mae.value = '${cliente.NomeMae}';
                                                        await reloadInputs(inputs.mae.id, 5000)
                                                        if (inputs.pai) {
                                                          inputs.pai.value = '${cliente.NomePai}';
                                                          await reloadInputs(inputs.pai.id, 5000)
                                                          if (inputs.ddd) {
                                                            inputs.ddd.value = '${parseInt(cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2))}';
                                                            await reloadInputs(inputs.ddd.id, 5000)
                                                            if (inputs.telefone) {
                                                              inputs.telefone.value = '${parseInt(cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2))}';
                                                              await reloadInputs(inputs.telefone.id, 5000)
                                                              if (inputs.ddd2) {
                                                                inputs.ddd2.value = '${parseInt(cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2))}';
                                                                await reloadInputs(inputs.ddd2.id, 5000)
                                                                if (inputs.celular) {
                                                                  inputs.celular.value = '${parseInt(cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2))}';
                                                                  await reloadInputs(inputs.celular.id, 5000)
                                                                  if (inputs.email) {
                                                                    inputs.email.value = '${cliente.Email}';
                                                                    await reloadInputs(inputs.email.id, 5000)
                            
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }

                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
loadCode()
`

      return { status: true, code1: code1 }
    } else return { status: false, error: client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...' }
  } catch(err) {
    console.log(`[BMG GENERATOR CARD ERROR] => ${err}`)
    console.log(err)
    return { status: false, error: '[0]=> Ocorreu algum erro no meu codigo! REPORTE AO YURI...' }
  }
}

module.exports = { PagBankINSS }