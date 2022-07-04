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
          const saldoObject = await changeObjectSaldo(getSaldo.data);
          var tabela = 38768;
          var taxa = 2.04;
          if (table.includes("GOLD")) {
            tabela = 38776;
            taxa = 2.04;
          } else if (!table.includes("NORMAL")) return { status: false, error: '[16]=> Só cadastro propostas na tabela NORMAL ou GOLD!' }
          const calcularSaldo = await facta.calcularSaldo(cpf, saldoObject.repasses, tabela, taxa, log);
          if (calcularSaldo && calcularSaldo.data) {
            if (calcularSaldo.data.permitido && calcularSaldo.data.valor_liquido && calcularSaldo.data.simulacao_fgts) {
              var data = {
                status: true,
                cpf: cpf,
                saldoLiberado: `R$ ${calcularSaldo.data.valor_liquido.replace(".","")}`,
                saldoTotal: `R$ ${saldoObject.saldo_total.replace(".",",")}`,
                data: `${saldoObject.data_saldo}`,
                parcelas: saldoObject.parcelas,
              }
              return data;
            } else {
              if (calcularSaldo.data.msg) return { status: false, error: `[15]=> ${calcularSaldo.data.msg}` }
              if (calcularSaldo.data.message) return { status: false, error: `[14]=> ${calcularSaldo.data.message}` }
              if (calcularSaldo.data.mensagem) return { status: false, error: `[13]=> ${calcularSaldo.data.mensagem}` }
              if (calcularSaldo.data['<b>Fatal error</b>']) return { status: false, error: `[12]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
              if (calcularSaldo.data['<b>Notice</b>']) return { status: false, error: `[11]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
              console.log(`[Facta FGTS Error(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
              console.log(calcularSaldo.data)
              return { status: false, error: '[10]=> Ocorreu algum erro ao calcular o saldo do cliente! Tente novamente mais tarde...' }
            }
          } else return { status: false, error: '[9]=> Ocorreu algum erro ao calcular o saldo do cliente! Tente novamente mais tarde...' }
        } else {
          if (getSaldo.data.msg) return { status: false, error: `[8]=> ${getSaldo.data.msg}` }
          if (getSaldo.data.message) return { status: false, error: `[7]=> ${getSaldo.data.message}` }
          if (getSaldo.data.mensagem) return { status: false, error: `[6]=> ${getSaldo.data.mensagem}` }
          if (getSaldo.data['<b>Fatal error</b>']) return { status: false, error: `[5]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
          if (getSaldo.data['<b>Notice</b>']) return { status: false, error: `[4]=> Ocorreu algum erro no banco de dados da facta! Tente novamente mais tarde...` }
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

function changeObjectSaldo(response) {
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
      data: response.retorno[`dataRepasse_${i+1}`], 
      valor: `R$ ${response.retorno[`valor_${i+1}`].replace(".",",")}`,
    }
    molde.repasses[molde.repasses.length] = { 
      [`dataRepasse_${i+1}`]: response.retorno[`dataRepasse_${i+1}`],
      [`valor_${i+1}`]: parcelas.includes(i) ? response.retorno[`valor_${i+1}`] : 0,
    }
  }
  return molde;
};