const BMG = require('../../APIs/BMG');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');

const BMGFGTS = async (cpf, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
      const bmg = await new BMG();
      log.situation = `[1]=> Conectando na API...`
      const loadAPI = await bmg.refreshToken(log)
      if (loadAPI) {
        var simula = {
          "login":process.env.BMG_USER,
          "senha":process.env.BMG_PASSWORD,
          "cpfCliente":cpf,
          "dataNascimento":new Date('1967-08-10T00:00:00.000Z'),
          "entidade":'4262',
          "loja":'53541',
          "produto":9665,
          "qtdParcelas": 10,
          "sequencialOrgao":"",
          "servico":'135'
        }
        var simularProposta = await bmg.simularProposta(simula, log);
        if (simularProposta && simularProposta.data) {
          if (simularProposta.data.simularSaqueAniversarioFgtsResponse && simularProposta.data.simularSaqueAniversarioFgtsResponse.simularSaqueAniversarioFgtsReturn && simularProposta.data.simularSaqueAniversarioFgtsResponse.simularSaqueAniversarioFgtsReturn.sucesso) {
            var simularResponse = simularProposta.data.simularSaqueAniversarioFgtsResponse.simularSaqueAniversarioFgtsReturn
            var data = simularResponse.dataVigenciaInicial.slice(0, 10)
            var ano = data.slice(0,4)
            var mes = data.slice(5,7)
            var dia = data.slice(8,10)
            var data = {
              status: true,
              cpf: cpf,
              saldoLiberado: simularResponse.valorLiberado,
              saldoTotal: simularResponse.valorOriginal,
              taxa: simularResponse.valorTaxaCadastro,
              data: `${dia}/${mes}/${ano}`,
              parcelas: [],
            }
            await simularResponse.parcelas.forEach((parc)=>{
              var valor = parc.dataVencimento.slice(0, 10)
              var ano = valor.slice(0,4)
              var mes = valor.slice(5,7)
              var dia = valor.slice(8,10)
              data.parcelas[data.parcelas.length] = { data: `${dia}/${mes}/${ano}`, valor: parc.parcelaLiberada }
            })
            return data;
          } else {
            if (simularProposta.data.simularSaqueAniversarioFgtsResponse && simularProposta.data.simularSaqueAniversarioFgtsResponse.error && simularProposta.data.simularSaqueAniversarioFgtsResponse.error.message) return saveDB(pool, cliente.IdContrato, 824, '', `[4]=> ${simularProposta.data.simularSaqueAniversarioFgtsResponse.error.message.replace("java.lang.IllegalArgumentException:", "").replace("com.bmg.econsig.common.exception.ServiceException:", "")}`, false)
            console.log(`[BMG FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
            console.log(simularProposta.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Problema na conexão da API! Tente novamente mais tarde...', false)
  } catch(err) {
    console.log(`[BMG FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { BMGFGTS }