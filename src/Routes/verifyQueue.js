const { MSSQL, MongoDB } = require('../Utils/database');
const moment = require(`moment`);
moment.locale("pt-BR");

const verifyQueue = async (req, res, queue) => {
  try {
    if (queue.length > 0) {
      if (queue.findIndex(r=>r.user == req.body.user) >= 0) {
        if (queue.findIndex(r=>r.user == req.body.user)+1 == req.body.fila) {
          await timeout(queue.findIndex(r=>r.user == req.body.user)+2000)
          return verifyQueue(req, res, queue)
        } else return res.status(200).json({ status: true, fila: queue.findIndex(r=>r.user == req.body.user)+1 })
      } return res.status(200).json({ status: false })
    } else return res.status(200).json({ status: false })
  }catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /verifyQueue] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = verifyQueue

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }