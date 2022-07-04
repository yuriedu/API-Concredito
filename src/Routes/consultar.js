const { MSSQL, MongoDB } = require('../Utils/database');
const { removeSpaces } = require('../Utils/functions');

const { C6FGTS } = require('../Controllers/Consultas/C6');
const { FactaFGTS } = require('../Controllers/Consultas/Facta');
const { BMGFGTS } = require('../Controllers/Consultas/BMG');
const { MercantilFGTS } = require('../Controllers/Consultas/Mercantil');
const { SafraFGTS } = require('../Controllers/Consultas/Safra');
const { PanFGTS } = require('../Controllers/Consultas/Pan');

const consultar = async (req, res, queue, verify) => {
  try {
    if (!req.body.user || !req.body.password || !req.body.cpf || !req.body.bank) return res.status(200).json({ status: false, error: `Informações necessarias estão faltando...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password && r.permissions.consultFgts) < 0) {
        if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
        return res.status(200).json({ status: false, error: `Você não possui permissão para acessar esse sistema!` })
      }
      if (!verify) {
        if (queue.length > 0 && queue.find(r=>r.user == req.body.user)) return res.status(200).json({ status: false, error: `Você já está consultando algum CPF! Aguarde a consulta anterior acabar para consultar outro CPF...` })
        queue[queue.length] = { user: req.body.user, cpf: req.body.cpf }
        await timeout(queue.findIndex(r=>r.user == req.body.user)+1000)
        return consultar(req, res, queue, true)
      } else {
        if (queue.length <= 0) return res.status(200).json({ status: false, error: `A fila está vazia! Tente novamente...` })
        if (queue.findIndex(r=>r.user == req.body.user) < 0) return res.status(200).json({ status: false, error: `Você não está na fila! Tente novamente...` })
        if (queue.findIndex(r=>r.user == req.body.user) != 0) {
          await timeout(queue.findIndex(r=>r.user == req.body.user)+1000)
          return consultar(req, res, queue, true)
        }
      }
      var response = false
      if (req.body.bank == "FACTA FINANCEIRA") {
        response = await FactaFGTS(req.body.cpf, req.body.option1, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "BANCO C6") {
        if (!req.body.option2 && (req.body.option1 == 'POR_VALOR_SOLICITADO' || req.body.option1 == 'POR_QUANTIDADE_DE_PARCELAS')) {
          if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
          return res.status(200).json({ status: false, error: `Valor não informado! Verifique e tente novamente...` })
        }
        response = await C6FGTS(req.body.cpf, req.body.option1, req.body.option2, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "PANAMERICANO") {
        if (req.body.option1 == 'POR_VALOR_SOLICITADO' && !req.body.option2) {
          if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
          return res.status(200).json({ status: false, error: `Valor não informado! Verifique e tente novamente...` })
        }
        response = await PanFGTS(req.body.cpf, req.body.option1, req.body.option2, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "SAFRA") {
        response = await SafraFGTS(req.body.cpf, req.body.option1, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "MERCANTIL") {
        if (req.body.option1 == 'POR_QUANTIDADE_DE_PARCELAS' && !req.body.option2) {
          if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
          return res.status(200).json({ status: false, error: `Quantidades de parcelas não informado! Verifique e tente novamente...` })
        }
        response = await MercantilFGTS(req.body.cpf, req.body.option1, req.body.option2, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else if (req.body.bank == "BMG") {
        response = await BMGFGTS(req.body.cpf, { cpf: req.body.cpf, situation: 'Consultando FGTS...' });
      } else {
        if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
        return res.status(200).json({ status: false, error: `Banco selecionado não encontrado! Verifique e tente novamente...` })
      }
      if (response && response.status) {
        var data = {
          _id: req.body.bank,
          saldoTotal: response.saldoTotal,
          saldoLiberado: response.saldoLiberado,
          data: response.data,
          parcelas: response.parcelas.length,
        }
        var userTable = table.users.find(r=>r._id === req.body.user && r.password === req.body.password && r.permissions.consultFgts)
        if (userTable.counts.consultFgts.find(r=>r._id == req.body.cpf)) {
          if (userTable.counts.consultFgts.find(r=>r._id == req.body.cpf).banks.find(r=>r._id==req.body.bank)) {
            userTable.counts.consultFgts.find(r=>r._id == req.body.cpf).banks[userTable.counts.consultFgts.find(r=>r._id == req.body.cpf).banks.findIndex(r=>r._id==req.body.bank)] = data
          } else userTable.counts.consultFgts.find(r=>r._id == req.body.cpf).banks[userTable.counts.consultFgts.find(r=>r._id == req.body.cpf).banks.length] = data
        } else userTable.counts.consultFgts[userTable.counts.consultFgts.length] = { _id: req.body.cpf, banks: [data] }
        await table.save();
        if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
        return res.status(200).json(response)
      }
      if (response && response.error) {
        if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
        return res.status(200).json({ status: false, error: response.error })
      }
    })
  }catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") {
      if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
      return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    }
    if (queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf) >= 0) queue.splice(queue.findIndex(r => r.user == req.body.user && r.cpf == req.body.cpf), 1)
    console.log(`[POST /consultar] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = consultar

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }