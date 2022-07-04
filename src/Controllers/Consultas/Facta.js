const Facta = require('../../APIs/Facta');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');

const FactaFGTS = async (cpf, table, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    const facta = await new Facta();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await facta.refreshToken(log)
    if (loadAPI) {
      const getSaldo = await facta.getSaldo(cpf, log)
      if (getSaldo && getSaldo.data) {
        if (getSaldo.data.tipo == "Sucesso" && getSaldo.data.retorno && getSaldo.data.retorno.data_saldo && getSaldo.data.retorno.horaSaldo && getSaldo.data.retorno.saldo_total) {
          const saldoObject = await changeObjectSaldo(getSaldo.data, cliente);
          var tabela = 38768;
          var taxa = 2.04;
          if (table.includes("GOLD")) {
            tabela = 38776;
            taxa = 2.04;
          } else if (!table.includes("NORMAL")) return { status: false, error: '[4]=> Só cadastro propostas na tabela NORMAL ou GOLD!' }
          const calcularSaldo = await facta.calcularSaldo(cpf, saldoObject.repasses, tabela, taxa, log);
          if (calcularSaldo && calcularSaldo.data) {
            if (calcularSaldo.data.permitido && calcularSaldo.data.valor_liquido && calcularSaldo.data.simulacao_fgts) {
              const simularProposta = await facta.simularProposta(cpf, calcularSaldo.data.simulacao_fgts.toString(), '12/12/12', log);
              if (simularProposta && simularProposta.data) {
                if (simularProposta.data.id_simulador) {
                  console.log(getSaldo.data)
                  console.log(calcularSaldo.data)
                  console.log(simularProposta.data)
                } else {
                  if (simularProposta.data.msg) return { status: false, error: `[10]=> ${simularProposta.data.msg}` }
                  if (simularProposta.data.message) return { status: false, error: `[10]=> ${simularProposta.data.message}` }
                  if (simularProposta.data.mensagem) return { status: false, error: `[10]=> ${simularProposta.data.mensagem}` }
                  if (simularProposta.data['<b>Fatal error</b>']) return { status: false, error: `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
                  if (simularProposta.data['<b>Notice</b>']) return { status: false, error: `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
                  console.log(`[Facta FGTS Error(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                  console.log(simularProposta.data)
                  return { status: false, error: '[10]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
                }
              } else return { status: false, error: '[9]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
            } else {
              if (calcularSaldo.data.msg) return { status: false, error: `[6]=> ${calcularSaldo.data.msg}` }
              if (calcularSaldo.data.message) return { status: false, error: `[6]=> ${calcularSaldo.data.message}` }
              if (calcularSaldo.data.mensagem) return { status: false, error: `[6]=> ${calcularSaldo.data.mensagem}` }
              if (calcularSaldo.data['<b>Fatal error</b>']) return { status: false, error: `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
              if (calcularSaldo.data['<b>Notice</b>']) return { status: false, error: `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
              console.log(`[Facta FGTS Error(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
              console.log(calcularSaldo.data)
              return { status: false, error: '[6]=> Ocorreu algum erro ao calcular o saldo do cliente! Tente novamente mais tarde...' }
            }
          } else return { status: false, error: '[5]=> Ocorreu algum erro ao calcular o saldo do cliente! Tente novamente mais tarde...' }
        } else {
          if (getSaldo.data.msg) return { status: false, error: `[6]=> ${getSaldo.data.msg}` }
          if (getSaldo.data.message) return { status: false, error: `[6]=> ${getSaldo.data.message}` }
          if (getSaldo.data.mensagem) return { status: false, error: `[6]=> ${getSaldo.data.mensagem}` }
          if (getSaldo.data['<b>Fatal error</b>']) return { status: false, error: `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
          if (getSaldo.data['<b>Notice</b>']) return { status: false, error: `[6]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
          console.log(`[Facta FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
          console.log(getSaldo.data)
          return { status: false, error: '[3]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...' }
        }
      } else return { status: false, error: '[2]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...' }
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Facta FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { FactaFGTS }

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
  const parcelas = [...Array(12).keys()]
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