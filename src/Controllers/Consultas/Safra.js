const Safra = require('../../APIs/Safra');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

const SafraFGTS = async (cpf, produto, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    const safra = await new Safra();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await safra.refreshToken(log)
    if (loadAPI) {
      const getSaldo = await safra.getSaldo(cpf, produto, log)
      if (getSaldo && getSaldo.data) {
        if (getSaldo.data.periodos) {
          const parcelas = getSaldo.data.periodos.map(element => { return { dtRepasse: element.dtRepasse, valorReservado: element.valor, dataRepasse: element.dtRepasse, valorRepasse: element.valor, valorFinanciado: element.valor }})
          const tabelas = await safra.getTabelaJuros(log)
          if (tabelas && tabelas.data) {
            if (tabelas.data.find(r=> r.id == 232219)) {
              const calcularProposta = await safra.calcularProposta(tabelas.data.find(r=> r.id == 232219).id, parcelas, cpf, produto, log)
              if (calcularProposta && calcularProposta.data) {
                if (calcularProposta.data.simulacoes && calcularProposta.data.simulacoes[0] && calcularProposta.data.simulacoes[0].valorPrincipal && calcularProposta.data.simulacoes[0].idTabelaJuros && calcularProposta.data.simulacoes[0].prazo && calcularProposta.data.simulacoes[0].valorParcela) {
                  var date = moment(new Date(), 'DD/MM/YYYY').format('DD-MM-YYYY').replace("-","/").replace("-","/")
                  var data = {
                    status: true,
                    cpf: getSaldo.data.idCliente,
                    saldoLiberado: `R$ ${String(calcularProposta.data.simulacoes[0].valorPrincipal).replace('.',',')}`,
                    saldoTotal: 0,
                    data: `${date}`,
                    parcelas: [],
                  }
                  await getSaldo.data.periodos.forEach((parc)=>{
                    var valor = parc.dtRepasse.slice(0, 10)
                    var ano = valor.slice(0,4)
                    var mes = valor.slice(5,7)
                    var dia = valor.slice(8,10)
                    data.saldoTotal += Number(parc.valor)
                    data.parcelas[data.parcelas.length] = { data: `${dia}/${mes}/${ano}`, valor: `R$ ${String(parc.valor).replace(".",",")}` }
                  })
                  data.saldoTotal = `R$ ${String(data.saldoTotal).replace('.',',')}`
                  console.log(data)
                  return data
                } else {
                  if (calcularProposta.data.erros && calcularProposta.data.erros[0].descricao) return { status: false, error: `[13]=> ${calcularProposta.data.erros[0].descricao}` }
                  if (calcularProposta.data.erros && calcularProposta.data.erros.descricao) return { status: false, error: `[12]=> ${calcularProposta.data.erros.descricao}` }
                  console.log(`[Safra FGTS Error(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                  console.log(calcularProposta.data)
                  return { status: false, error: '[11]=> Ocorreu algum erro ao calcular a proposta! Tente novamente mais tarde...' }
                }
              } else return { status: false, error: '[10]=> Ocorreu algum erro ao calcular a proposta! Tente novamente mais tarde...' }
            } else {
              if (tabelas.data.erros && tabelas.data.erros[0].descricao) return { status: false, error: `[9]=> ${tabelas.data.erros[0].descricao}` }
              if (tabelas.data.erros && tabelas.data.erros.descricao) return { status: false, error: `[8]=> ${tabelas.data.erros.descricao}` }
              console.log(`[Safra FGTS Error(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
              console.log(tabelas.data)
              return { status: false, error: '[7]=> Ocorreu algum erro ao consultar o juros da tabela! Tente novamente mais tarde...' }
            }
          } else return { status: false, error: '[6]=> Ocorreu algum erro ao consultar o juros da tabela! Tente novamente mais tarde...' }
        } else {
          if (getSaldo.data.erros && getSaldo.data.erros[0].descricao) return { status: false, error: `[5]=> ${getSaldo.data.erros[0].descricao}` }
          if (getSaldo.data.erros && getSaldo.data.erros.descricao) return { status: false, error: `[4]=> ${getSaldo.data.erros.descricao}` }
          console.log(`[Safra FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
          console.log(getSaldo.data)
          return { status: false, error: '[3]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...' }
        }
      } else return { status: false, error: '[2]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...' }
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Safra FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { SafraFGTS }