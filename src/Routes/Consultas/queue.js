const { MSSQL, MongoDB } = require('../../Utils/database');
const moment = require(`moment`);
moment.locale("pt-BR");

const Queue = async (req, res, queue) => {
  try {
    if (queue[req.body.bank] && queue[req.body.bank].length > 0) {
      if (queue[req.body.bank].find(r=>r.user == req.body.user)) {
        if (queue[req.body.bank].findIndex(r=>r.user == req.body.user)+1 == req.body.fila) {
          await timeout(queue[req.body.bank].findIndex(r=>r.user == req.body.user)+2000)
          return Queue(req, res, queue)
        } else return res.status(200).json({ status: true, bank: req.body.bank, fila: queue[req.body.bank].findIndex(r=>r.user == req.body.user)+1 })
      } return res.status(200).json({ status: false })
    } else return res.status(200).json({ status: false })
  }catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /consultas/queue] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = Queue

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }