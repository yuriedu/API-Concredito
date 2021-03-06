const Facta = require('../../APIs/Facta');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');

const FactaFGTS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "FGTS");
    if (client && client.status) {
      const facta = await new Facta();
      log.situation = `[1]=> Conectando na API...`
      const loadAPI = await facta.refreshToken(log)
      if (loadAPI) {
        const getSaldo = await facta.getSaldo(cliente.Cpf, log)
        if (getSaldo && getSaldo.data) {
          if (getSaldo.data.tipo == "Sucesso" && getSaldo.data.retorno && getSaldo.data.retorno.data_saldo && getSaldo.data.retorno.horaSaldo && getSaldo.data.retorno.saldo_total) {
            const saldoObject = await changeObjectSaldo(getSaldo.data, cliente);
            var tabela = 38768;
            var taxa = 2.04;
            if (cliente.Tabela.includes("GOLD")) {
              tabela = 38776;
              taxa = 2.04;
            } else if (!cliente.Tabela.includes("NORMAL")) return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Só cadastro propostas na tabela NORMAL ou GOLD!', false)
            const calcularSaldo = await facta.calcularSaldo(cliente.Cpf, saldoObject.repasses, tabela, taxa, log);
            if (calcularSaldo && calcularSaldo.data) {
              if (calcularSaldo.data.permitido && calcularSaldo.data.valor_liquido && calcularSaldo.data.simulacao_fgts) {
                if (parseFloat(calcularSaldo.data.valor_liquido.replace(',','.')) - cliente.Valor > cliente.Valor*0.05) return saveDB(pool, cliente.IdContrato, 824, '', `[7]=> Valor simulado é mais de 5% menor que o proposto ao cliente! Altere o valor e tente novamente... Valor da simulação: ${calcularSaldo.data.valor_liquido}`, false)
                const cidadeDoCliente = await facta.getCidadesByCidade(cliente.Cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, ""), cliente.UF, log)
                if (cidadeDoCliente) {
                  const simularProposta = await facta.simularProposta(cliente.Cpf, calcularSaldo.data.simulacao_fgts.toString(), cliente.Datanascimento.toISOString().split('T')[0], log);
                  if (simularProposta && simularProposta.data) {
                    if (simularProposta.data.id_simulador) {
                      const clientData = {
                        cpf: cliente.Cpf,
                        nome: cliente.NomeCliente,
                        sexo: cliente.sexo,
                        estado_civil: 6,
                        data_nascimento: cliente.Datanascimento.toISOString().split('T')[0],
                        rg: cliente.rg, 
                        estado_rg: cliente.UF,
                        orgao_emissor: 'SSP',
                        data_expedicao: '01/01/2010',
                        estado_natural: cliente.UF,
                        cidade_natural: Object.keys(cidadeDoCliente)[0],
                        nacionalidade: 1,
                        pais_origem: 26,
                        celular: cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').replace(/^(\d{2})(\d{5})(\d{4})/,'(0$1) $2-$3'),
                        renda: 2000,
                        cep: cliente.Cep,
                        endereco: cliente.Endereco,
                        numero: cliente.EndNumero,
                        bairro: cliente.Bairro,
                        cidade: Object.keys(cidadeDoCliente)[0],
                        estado: cliente.UF,
                        nome_mae: cliente.NomeMae,
                        nome_pai: cliente.NomePai == null ? 'Não Consta' : cliente.NomePai,
                        valor_patrimonio: 2,
                        cliente_iletrado_impossibilitado: 'N',
                        banco: bancoTranslate(cliente.CodBancoCliente),
                        agencia: cliente.Agencia,
                        conta: revisaoPoupanca(parseInt(cliente.ContaCorrente.replace(/\D+/g, '')).toString(),cliente.Poupanca)
                      }
                      const registerProposta = await facta.registerProposta(simularProposta.data.id_simulador, clientData, log);
                      if (registerProposta && registerProposta.data) {
                        if (registerProposta.data.codigo_cliente) {
                          const requestProposta = await facta.requestProposta(simularProposta.data.id_simulador, registerProposta.data.codigo_cliente, log);
                          if (requestProposta && requestProposta.data) {
                            if (requestProposta.data.codigo && requestProposta.data.url_formalizacao) {
                              await updateContratoDB(pool, cliente.IdContrato, Number(calcularSaldo.data.valor_liquido.replace(".","").replace(",",".")) ? Number(calcularSaldo.data.valor_liquido.replace(".","").replace(",",".")) : cliente.Valor, cliente.ValorParcela, 'Valores do Contrato atualizados')
                              return saveDB(pool, cliente.IdContrato, 9232, requestProposta.data.codigo, `http://${requestProposta.data.url_formalizacao}`, true)
                            } else {
                              if (requestProposta.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[14]=> ${requestProposta.data.msg}`, false)
                              if (requestProposta.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[14]=> ${requestProposta.data.message}`, false)
                              if (requestProposta.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[14]=> ${requestProposta.data.mensagem}`, false)
                              if (requestProposta.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro na facta! Verifique no banco se a proposta foi cadastrada!`, false)
                              if (requestProposta.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro na facta! Verifique no banco se a proposta foi cadastrada!`, false)
                              console.log(`[Facta FGTS Error(5) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                              console.log(requestProposta.data)
                              return saveDB(pool, cliente.IdContrato, 824, '', '[14]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
                            }
                          } else return saveDB(pool, cliente.IdContrato, 824, '', '[13]=> Ocorreu algum erro ao solicitar a proposta do cliente! Tente novamente mais tarde...', false)
                        } else {
                          if (registerProposta.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[12]=> ${registerProposta.data.msg}`, false)
                          if (registerProposta.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[12]=> ${registerProposta.data.message}`, false)
                          if (registerProposta.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[12]=> ${registerProposta.data.mensagem}`, false)
                          if (registerProposta.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro na facta! Verifique no banco se a proposta foi cadastrada!`, false)
                          if (registerProposta.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro na facta! Verifique no banco se a proposta foi cadastrada!`, false)
                          console.log(`[Facta FGTS Error(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                          console.log(registerProposta.data)
                          return saveDB(pool, cliente.IdContrato, 824, '', '[12]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
                        }
                      } else return saveDB(pool, cliente.IdContrato, 824, '', '[11]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
                    } else {
                      if (simularProposta.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${simularProposta.data.msg}`, false)
                      if (simularProposta.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${simularProposta.data.message}`, false)
                      if (simularProposta.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${simularProposta.data.mensagem}`, false)
                      if (simularProposta.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                      if (simularProposta.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                      console.log(`[Facta FGTS Error(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                      console.log(simularProposta.data)
                      return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
                    }
                  } else return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
                } else return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> A cidade não foi encontrada no banco da facta! Verifique e tente novamente....', false)
              } else {
                if (calcularSaldo.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${calcularSaldo.data.msg}`, false)
                if (calcularSaldo.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${calcularSaldo.data.message}`, false)
                if (calcularSaldo.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${calcularSaldo.data.mensagem}`, false)
                if (calcularSaldo.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                if (calcularSaldo.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                console.log(`[Facta FGTS Error(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                console.log(calcularSaldo.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[6]=> Ocorreu algum erro ao calcular o saldo do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[5]=> Ocorreu algum erro ao calcular o saldo do cliente! Tente novamente mais tarde...', false)
          } else {
            if (getSaldo.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${getSaldo.data.msg}`, false)
            if (getSaldo.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${getSaldo.data.message}`, false)
            if (getSaldo.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${getSaldo.data.mensagem}`, false)
            if (getSaldo.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
            if (getSaldo.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
            console.log(`[Facta FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
            console.log(getSaldo.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[1]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Facta FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

const FactaCART = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "INSS");
    if (client && client.status) {
      const facta = await new Facta();
      log.situation = `[1]=> Conectando na API...`
      const loadAPI = await facta.refreshToken(log)
      if (loadAPI) {
        var saldo = {
          produto: 'D',
          tipo_operacao: 33,
          averbador: 3,
          convenio: 3,
          opcao_valor: 1,
          valor: cliente.ValorParcela / 0.03636364,
          cpf: cliente.Cpf,
          data_nascimento: cliente.Datanascimento.toISOString().split('T')[0],
          valor_renda: cliente.ValorParcela / 5 * 100,
        }
        var getSaldo = await facta.getSaldoCART(saldo, log)
        if (getSaldo && getSaldo.data) {
          if (getSaldo.data.tabelas && getSaldo.data.tabelas[0] && getSaldo.data.tabelas.findIndex(r=>r.codigoTabela == '98945') >= 0) {
            getSaldo = getSaldo.data.tabelas.find(r=>r.codigoTabela == '98945')
            var simulation = {
              produto: 'D',
              tipo_operacao: 33,
              averbador: 3,
              convenio: 3,
              cpf: cliente.Cpf,
              data_nascimento: cliente.Datanascimento.toISOString().split('T')[0],
              login_certificado: process.env.FACTA_CERTIFICADO,
              codigo_tabela: getSaldo.codigoTabela,
              prazo: getSaldo.prazo,
              valor_operacao: getSaldo.contrato,
              valor_parcela: getSaldo.parcela,
              coeficiente: getSaldo.coeficiente,
              valor_renda: cliente.ValorParcela / 5 * 100,
            }
            const simularProposta = await facta.simularPropostaCART(simulation, log)
            if (simularProposta && simularProposta.data) {
              if (simularProposta.data.id_simulador) {
                const cidadeDoCliente = await facta.getCidadesByCidade(cliente.Cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, ""), cliente.UF, log)
                if (cidadeDoCliente) {
                  const clientData = {
                    id_simulador: simularProposta.data.id_simulador,
                    cpf: cliente.Cpf,
                    nome: cliente.NomeCliente,
                    sexo: cliente.sexo,
                    estado_civil: 6,
                    data_nascimento: cliente.Datanascimento.toISOString().split('T')[0],
                    rg: cliente.rg, 
                    estado_rg: cliente.UF,
                    orgao_emissor: 'SSP',
                    data_expedicao: '01/01/2010',
                    estado_natural: cliente.UF,
                    cidade_natural: Object.keys(cidadeDoCliente)[0],
                    nacionalidade: 1,
                    pais_origem: 26,
                    celular: cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').replace(/^(\d{2})(\d{5})(\d{4})/,'(0$1) $2-$3'),
                    renda: 2000,
                    cep: cliente.Cep,
                    endereco: cliente.Endereco,
                    numero: cliente.EndNumero,
                    bairro: cliente.Bairro,
                    cidade: Object.keys(cidadeDoCliente)[0],
                    estado: cliente.UF,
                    nome_mae: cliente.NomeMae,
                    nome_pai: cliente.NomePai == null ? 'Não Consta' : cliente.NomePai,
                    valor_patrimonio: 2,
                    cliente_iletrado_impossibilitado: 'N',
                    banco: bancoTranslate(cliente.CodBancoCliente),
                    agencia: cliente.Agencia,
                    conta: revisaoPoupanca(parseInt(cliente.ContaCorrente.replace(/\D+/g, '')).toString(),cliente.Poupanca),
                    matricula: cliente.BeneficioAF ? cliente.BeneficioAF : cliente.Maatricula,
                    tipo_credito_nb: cliente.TipoLiberacao == 4 ? 2 : 1,
                    tipo_beneficio: cliente.EspecieAF ? cliente.EspecieAF : cliente.Especie,
                    estado_beneficio: cliente.UF,
                    banco_desconto: cliente.TipoLiberacao == 4 ? cliente.CodBancoCliente : '',
                    agencia_desconto: cliente.TipoLiberacao == 4 ? cliente.Agencia : '',
                    conta_desconto: cliente.TipoLiberacao == 4 ? cliente.ContaCorrente : '',
                    banco_pagamento: cliente.TipoLiberacao == 4 ? cliente.CodBancoCliente : '',
                    agencia_pagamento: cliente.TipoLiberacao == 4 ? cliente.Agencia : '',
                    conta_pagamento: cliente.TipoLiberacao == 4 ? cliente.ContaCorrente : '',
                  }
                  const gravarProposta = await facta.gravarPropostaCART(clientData, log)
                  if (gravarProposta && gravarProposta.data) {
                    if (gravarProposta.data.codigo_cliente) {
                      var final = {
                        codigo_cliente: gravarProposta.data.codigo_cliente,
                        id_simulador: simularProposta.data.id_simulador,
                      }
                      const finalizarPropostaCART = await facta.finalizarPropostaCART(final, log)
                      if (finalizarPropostaCART && finalizarPropostaCART.data) {
                        if (finalizarPropostaCART.data.codigo && finalizarPropostaCART.data.url_formalizacao) {
                          await updateContratoDB(pool, cliente.IdContrato, getSaldo.contrato, cliente.ValorParcela, 'Valores do Contrato atualizados')
                          return saveDB(pool, cliente.IdContrato, 823, finalizarPropostaCART.data.codigo, `http://${finalizarPropostaCART.data.url_formalizacao}`, true)
                        } else {
                          if (finalizarPropostaCART.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${finalizarPropostaCART.data.msg}`, false)
                          if (finalizarPropostaCART.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${finalizarPropostaCART.data.message}`, false)
                          if (finalizarPropostaCART.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${finalizarPropostaCART.data.mensagem}`, false)
                          if (finalizarPropostaCART.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                          if (finalizarPropostaCART.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                          console.log(`[Facta FGTS Error(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                          console.log(finalizarPropostaCART.data)
                          return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao finalizar a proposta do cliente! Tente novamente mais tarde...', false)
                        }
                      } else return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao finalizar a proposta do cliente! Tente novamente mais tarde...', false)
                    } else {
                      if (gravarProposta.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${gravarProposta.data.msg}`, false)
                      if (gravarProposta.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${gravarProposta.data.message}`, false)
                      if (gravarProposta.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${gravarProposta.data.mensagem}`, false)
                      if (gravarProposta.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                      if (gravarProposta.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                      console.log(`[Facta FGTS Error(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                      console.log(simularProposta.data)
                      return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao gravar a proposta do cliente! Tente novamente mais tarde...', false)
                    }
                  } else return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao gravar a proposta do cliente! Tente novamente mais tarde...', false)
                } else return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> A cidade não foi encontrada no banco da facta! Verifique e tente novamente....', false)
              } else {
                if (simularProposta.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${simularProposta.data.msg}`, false)
                if (simularProposta.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${simularProposta.data.message}`, false)
                if (simularProposta.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${simularProposta.data.mensagem}`, false)
                if (simularProposta.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                if (simularProposta.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
                console.log(`[Facta FGTS Error(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                console.log(simularProposta.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          } else {
            if (getSaldo.data.msg) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${getSaldo.data.msg}`, false)
            if (getSaldo.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${getSaldo.data.message}`, false)
            if (getSaldo.data.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${getSaldo.data.mensagem}`, false)
            if (getSaldo.data['<b>Fatal error</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
            if (getSaldo.data['<b>Notice</b>']) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...`, false)
            console.log(`[Facta FGTS Error(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
            console.log(getSaldo.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao pegar o saldo da proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao pegar o saldo da proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[1]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Facta FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { FactaFGTS, FactaCART }

function changeObjectSaldo(response, cliente) {
  var molde = {
    data_saldo: response.retorno.data_saldo,
    horaSaldo: response.retorno.horaSaldo,
    saldo_total: response.retorno.saldo_total,
    parcelas: [],
    repasses: [],
  }
  const tranformArray = Object.keys(response.retorno);
  const dates = tranformArray.filter(r => r.includes('dataRepasse'));
  const parcelas = [...Array(cliente.Prazo).keys()]
  for (let i = 0; i < dates.length; i += 1) {
    molde.parcelas[molde.parcelas.length] = {
      index: i,
      data: response.retorno[`dataRepasse_${i+1}`], 
      valor: response.retorno[`valor_${i+1}`],
    }
    molde.repasses[molde.repasses.length] = { 
      [`dataRepasse_${i+1}`]: response.retorno[`dataRepasse_${i+1}`],
      [`valor_${i+1}`]: parcelas.includes(i) ? response.retorno[`valor_${i+1}`] : 0,
    }
  }
  return molde;
};

const revisaoPoupanca = (conta, poupanca) => {
  if(poupanca) {
    if(conta.slice(0,3) === '013'){
      return conta;
    }
    return `${conta}`;
  }
  return conta;
}