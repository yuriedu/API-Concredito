const Pan = require('../../APIs/Pan');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

const PanFGTS = async (cpf, type, valor, table, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    const pan = await new Pan();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await pan.refreshToken(log)
    if (loadAPI) {
      const simulation = {
        incluir_seguro: true,
        cpf_cliente: cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
        codigo_promotora: process.env.PAN_PROMOTER_CODE,
        data_nascimento: '10-08-1967',
      }
      if (type == 'POR_VALOR_SOLICITADO') simulation.valor_solicitado = valor
      const simularProposta = await pan.simularProposta(simulation, log);
      if (simularProposta && simularProposta.data) {
        if (simularProposta.data && simularProposta.data.condicoes_credito) {
          const tabela = simularProposta.data.condicoes_credito.find(element => element.codigo_tabela_financiamento == table)
          if (tabela && tabela.parcelas && tabela.valor_cliente && tabela.valor_bruto) {
            var date = moment(new Date(), 'DD/MM/YYYY').format('DD-MM-YYYY').replace("-","/").replace("-","/")
            var data = {
              status: true,
              cpf: cpf,
              saldoLiberado: `R$ ${String(tabela.valor_cliente).replace('.',',')}`,
              saldoTotal: `R$ ${String(tabela.valor_bruto).replace('.',',')}`,
              data: `${date}`,
              parcelas: [],
            }
            await tabela.parcelas.forEach((parc)=>{
              data.parcelas[data.parcelas.length] = { data: parc.data_vencimento, valor: parc.valor_parcela }
            })
            return data;
          } else return { status: false, error: `[5]=> Esse cliente não tem saldo liberado nessa tabela...` }
        } else {
          if (simularProposta.data.detalhes) return { status: false, error: `[4]=> ${simularProposta.data.detalhes[0] ? simularProposta.data.detalhes[0] : simularProposta.data.detalhes}` }
          console.log(`[Pan Consultas FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
          console.log(simularProposta.data)
          return { status: false, error: '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
        }
      } else return { status: false, error: '[2]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Pan Consultas FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { PanFGTS }