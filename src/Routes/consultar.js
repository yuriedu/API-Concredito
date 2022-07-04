const { MSSQL, MongoDB } = require('../Utils/database');
const { removeSpaces } = require('../Utils/functions');

const { C6FGTS } = require('../Controllers/Consultas/C6');
const { FactaFGTS } = require('../Controllers/Consultas/Facta');

const { MercantilFGTS } = require('../Controllers/Cadastros/Mercantil');
const { BMGFGTS } = require('../Controllers/Cadastros/BMG');
const { SafraFGTS } = require('../Controllers/Cadastros/Safra');
const { PanFGTS } = require('../Controllers/Cadastros/Pan');

const consultar = async (req, res, queue) => {
  try {
    if (!req.body.user || !req.body.password || !req.body.cpf || !req.body.bank) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Informações necessarias estão faltando...` })
    //FAZER SISTEMA DE FILA
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password && r.permissions.consult) < 0) return res.status(200).json({ status: false, error: `Você não possui permissão para acessar esse sistema!` })
      var response = false
      if (req.body.bank == "FACTA FINANCEIRA") {
        response = await FactaFGTS(req.body.cpf, req.body.option1, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "BANCO C6") {
        if (!req.body.option2 && (req.body.option1 == 'POR_VALOR_SOLICITADO' || req.body.option1 == 'POR_QUANTIDADE_DE_PARCELAS')) return res.status(200).json({ status: false, error: `Valor não informado! Verifique e tente novamente...` })
        response = await C6FGTS(req.body.cpf, req.body.option1, req.body.option2, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "PANAMERICANO") {
        if (req.body.option1 == 'POR_VALOR_SOLICITADO' && !req.body.option2) return res.status(200).json({ status: false, error: `Valor não informado! Verifique e tente novamente...` })
        response = await PanFGTS(req.body.cpf, req.body.option1, req.body.option2, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "SAFRA") {
        response = await SafraFGTS(req.body.cpf, req.body.option1, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "MERCANTIL") {
        if (req.body.option1 == 'POR_QUANTIDADE_DE_PARCELAS' && !req.body.option2) return res.status(200).json({ status: false, error: `Quantidades de parcelas não informado! Verifique e tente novamente...` })
        response = await MercantilFGTS(req.body.cpf, req.body.option1, req.body.option2, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "BMG") {
        response = await BMGFGTS(req.body.cpf, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else return res.status(200).json({ status: false, error: `Banco selecionado não encontrado! Verifique e tente novamente...` })
      //if (response && response.status) return res.send({ parcelas: response.parcelas, valor: response.valor, valorTotal: response.valorTotal })
      if (response && response.error) return res.status(200).json({ status: false, error: response.error })
    })
  }catch(err){
    if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /consultar] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = consultar