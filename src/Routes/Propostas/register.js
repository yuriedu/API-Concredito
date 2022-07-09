const { MSSQL, MongoDB } = require('../../Utils/database');
const { removeSpaces } = require('../../Utils/functions');

const { FactaFGTS } = require('../../Controllers/Cadastros/Facta');
const { C6FGTS } = require('../../Controllers/Cadastros/C6');
const { MercantilFGTS } = require('../../Controllers/Cadastros/Mercantil');
const { BMGFGTS } = require('../../Controllers/Cadastros/BMG');
const { SafraFGTS } = require('../../Controllers/Cadastros/Safra');
const { PanFGTS, PanINSS, PanCartINSS } = require('../../Controllers/Cadastros/Pan');
const { BanrisulINSS } = require('../../Controllers/Cadastros/Banrisul');

const registerPropostas = async (req, res, logs) => {
  try {
    if (!req.body.user || !req.body.password || !req.body.proposta) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Informações necessarias estão faltando...` })
    if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `A proposta já está sendo cadastrado...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password && r.permissions.propostas.lista) < 0) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Você não possui permissão para acessar esse sistema!` })
      const pool = await MSSQL();
      const db = {
        FGTS: await pool.request().input('orgao', 23).execute('pr_consulta_contratos_para_robo'),
        INSS: await pool.request().input('orgao', 1).execute('pr_consulta_contratos_para_robo'),
        CART: await pool.request().input('orgao', 7).execute('pr_consulta_contratos_para_robo')
      }
      var element = false
      if (db[req.body.proposta.orgaoProposta] && db[req.body.proposta.orgaoProposta].recordsets && db[req.body.proposta.orgaoProposta].recordsets[0] && db[req.body.proposta.orgaoProposta].recordsets[0].findIndex(r=> r.Cpf == req.body.proposta.Cpf && r.IdContrato == req.body.proposta.IdContrato) >= 0) element = db[req.body.proposta.orgaoProposta].recordsets[0][db[req.body.proposta.orgaoProposta].recordsets[0].findIndex(r=> r.Cpf == req.body.proposta.Cpf && r.IdContrato == req.body.proposta.IdContrato)]
      if (!element) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Essa proposta não está na fase 'AGUARDANDO DIGITAÇÃO AUTOMÁTICA'` })
      var logUser = logs[logs.length] = { id: req.body.proposta.Cpf, af: req.body.proposta.IdContrato, situation: "Iniciando Cadastro..." }
      setTimeout(()=>{ if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1) }, 600000)
      for (var key in element) { element[key] = await removeSpaces(element[key]) }
      var response = false;
      if (element.BancoContrato == "FACTA FINANCEIRA" && req.body.proposta.orgaoProposta == "FGTS") {
        response = await FactaFGTS(element, pool, logUser);
      } else if (element.BancoContrato == "BANCO C6" && req.body.proposta.orgaoProposta == "FGTS") {
        response = await C6FGTS(element, pool, logUser);
      } else if (element.BancoContrato == "PANAMERICANO" && req.body.proposta.orgaoProposta == "FGTS") {
        response = await PanFGTS(element, pool, logUser);
      } else if (element.BancoContrato == "SAFRA" && req.body.proposta.orgaoProposta == "FGTS") {
        response = await SafraFGTS(element, pool, logUser);
      } else if (element.BancoContrato == "MERCANTIL" && req.body.proposta.orgaoProposta == "FGTS") {
        response = await MercantilFGTS(element, pool, logUser);
      } else if (element.BancoContrato == "BMG" && req.body.proposta.orgaoProposta == "FGTS") {
        response = await BMGFGTS(element, pool, logUser, req.body.tokenBMG ? req.body.tokenBMG : false);
      } else if (element.BancoContrato == "PANAMERICANO" && req.body.proposta.orgaoProposta == "INSS") {
        response = await PanINSS(element, pool, logUser);
      } else if (element.BancoContrato == "FACTA FINANCEIRA" && req.body.proposta.orgaoProposta == "INSS") {
        // response = await FactaINSS(element, pool, logUser);
      } else if (element.BancoContrato == "BANRISUL" && req.body.proposta.orgaoProposta == "INSS") {
        response = await BanrisulINSS(element, pool, logUser);
      } else if (element.BancoContrato == "PANAMERICANO" && req.body.proposta.orgaoProposta == "CART") {
        response = await PanCartINSS(element, pool, logUser);
      } else {
        if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
        return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Banco/Orgão da proposta não é cadastravel pelo Robo! Cadastre manualmente!` })
      }
      if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
      if (response && response.status) return res.status(200).json({ status: true, proposta: req.body.proposta, data: response.data })
      if (response && response.data) return res.status(200).json({ status: false, proposta: req.body.proposta, error: response.data })
      return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Ocorreu algum erro ao cadastrar essa proposta! Aguarde um tempo e tente novamente, se o erro persistir reporte ao Yuri...` })
    })
  }catch(err){
    if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /cadastros/register] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = registerPropostas