const { MSSQL, MongoDB } = require('../Utils/database');

const loginVerify = async (req, res) => {
  try {
    if (!req.body.user || !req.body.password) return res.status(500).json({ status: false, error: `Usuário ou senha não foi informado...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password) < 0) return res.status(200).json({ status: false, error: `Usuário ou senha invalidos...` })
      return res.status(200).json({ status: true })
    })
  } catch(err) {
    console.log(`[POST /verifyLogin] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = loginVerify