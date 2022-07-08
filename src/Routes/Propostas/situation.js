const { MSSQL, MongoDB } = require('../../Utils/database');

const verifySituation = async (req, res, logs) => {
  try {
    if (!req.body.user || !req.body.password || !req.body.proposta) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Informações necessarias estão faltando...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password &&  r.permissions.propostas.lista) < 0) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Você não possui permissão para acessar esse sistema!` })
      var situation = await checkSituation(req.body.proposta, req.body.situation, logs)
      if (situation) {
        if (situation.notFound) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Not Found` })
        return res.status(200).json({ status: true, proposta: req.body.proposta, data: situation })
      } else return res.status(200).json({ status: 'error', proposta: req.body.proposta, error: `Não foi possivel verificar a situação dessa proposta` })
    })
  } catch(err) {
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /cadastros/situation] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function checkSituation(proposta, situation, logs) {
  if (logs.findIndex(r => r.id == proposta.Cpf && r.af == proposta.IdContrato) >= 0) {
    if (logs[logs.findIndex(r => r.id == proposta.Cpf && r.af == proposta.IdContrato)].situation == situation) {
      await timeout(1000)
      return checkSituation(proposta, situation, logs)
    } else return logs[logs.findIndex(r => r.id == proposta.Cpf && r.af == proposta.IdContrato)].situation
  } else return { notFound: true }
}

module.exports = verifySituation