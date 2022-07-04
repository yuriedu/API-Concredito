const Mercantil = require('../../APIs/Mercantil');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');

const MercantilFGTS = async (cpf, type, valor, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
      const mercantil = await new Mercantil();
      log.situation = `[1]=> Conectando na API...`
      const loadAPI = await mercantil.refreshToken(log)
      if (loadAPI) {
        const getSaldo = await mercantil.getSaldo(cpf, log);
        if (getSaldo && getSaldo.data) {
          if (getSaldo.data.parcelas && getSaldo.data.valorTotal) {
            const correspondente = {
              usuarioDigitador:process.env.MERCANTIL_USUARIO,
              cpfAgenteCertificado:parseInt(process.env.MERCANTIL_CPF.replace(/\D+/g, '')),
              ufAtuacao: "RS"
              // "usuarioDigitador": process.env.MERCANTIL_USUARIO.TEST,
              // "cpfAgenteCertificado": parseInt(process.env.MERCANTIL_CPF_TEST.replace(/\D+/g, '')),
              // "ufAtuacao": "MG"
            }
            const simula = {
              cpf: parseInt(cpf.replace(/\D+/g, '')),
              parcelas: [],
              correspondente
            }
            var data = getSaldo.data.dataReferenciaSaldo.slice(0, 10)
            var ano = data.slice(0,4)
            var mes = data.slice(5,7)
            var dia = data.slice(8,10)
            var data = {
              status: true,
              cpf: getSaldo.data.cpf,
              saldoTotal: `R$ ${String(getSaldo.data.valorTotal).replace('.',',')}`,
              data: `${dia}/${mes}/${ano}`,
              parcelas: [],
            }
            await getSaldo.data.parcelas.forEach((element,index)=>{
              if (type == "POR_QUANTIDADE_DE_PARCELAS" && index > Number(numberParc) - 1) return;
              if (element.valor < 9) return;
              simula.parcelas[simula.parcelas.length] = { dataVencimento: element.dataRepasse, valor: element.valor }
              var date = element.dataRepasse.slice(0, 10)
              var ano = date.slice(0,4)
              var mes = date.slice(5,7)
              var dia = date.slice(8,10)
              return data.parcelas[data.parcelas.length] = { data: `${dia}/${mes}/${ano}`, valor: `R$ ${String(element.valor).replace('.',",")}` }
            })
            const simularProposta = await mercantil.simularProposta(simula, log);
            if (simularProposta && simularProposta.data) {
              if (simularProposta.data.id && simularProposta.data.valorEmprestimo) {
                data.saldoLiberado = `R$ ${String(simularProposta.data.valorEmprestimo).replace('.',',')}`
                return data;
              } else {
                if (simularProposta.data.errors && simularProposta.data.errors[0] && simularProposta.data.errors[0].message) return { status: false, error: `[9]=> ${simularProposta.data.errors[0].message}` }
                if (simularProposta.data.errors && Object.keys(simularProposta.data.errors) && Object.keys(simularProposta.data.errors)[0]) return { status: false, error: `[8]=> ${Object.keys(simularProposta.data.errors)[0]}! Verifique e tente novamente...` }
                console.log(`[Mercantil FGTS Error(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
                console.log(simularProposta.data)
                return { status: false, error: '[7]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
              }
            } else return { status: false, error: '[5]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...' }
          } else {
            if (getSaldo.data.errors && getSaldo.data.errors[0] && getSaldo.data.errors[0].message) return { status: false, error: `[5]=> ${getSaldo.data.errors[0].message}` }
            if (getSaldo.data.errors && Object.keys(getSaldo.data.errors) && Object.keys(getSaldo.data.errors)[0]) return { status: false, error: `[4]=> ${Object.keys(getSaldo.data.errors)[0]}! Verifique e tente novamente...` }
            console.log(`[Mercantil FGTS Error(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
            console.log(getSaldo.data)
            return { status: false, error: '[3]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...' }
          }
        } else return { status: false, error: '[2]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...' }
      } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Mercantil FGTS ERROR - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
    console.log(err)
  }
}

module.exports = { MercantilFGTS }