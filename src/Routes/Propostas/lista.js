const { MSSQL, MongoDB } = require('../../Utils/database');

var SQLOFF = false

const lista = async (req, res) => {
  try {
    if (!req.body.user || !req.body.password) return res.status(500).json({ status: false, error: `Usuário ou senha não foi informado...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password && r.permissions.propostas.lista) < 0) return res.status(200).json({ status: false, error: `Você não possui permissão para acessar esse sistema!` })
      if (SQLOFF) {
        return res.status(200).send({ MongoDB: table.propostas.filter(r=>r.status == true), MongoDBSucess: table.propostas.filter(r=>r.status == false), FGTS: false, INSS: false, CART: false })
      } else {
        const pool = await MSSQL();
        const FGTS = await pool.request().input('orgao', 23).execute('pr_consulta_contratos_para_robo');
        const INSS = await pool.request().input('orgao', 1).execute('pr_consulta_contratos_para_robo');
        const CART = await pool.request().input('orgao', 7).execute('pr_consulta_contratos_para_robo');
        return res.status(200).send({ MongoDB: false, MongoDBSucess: false, FGTS: FGTS.recordsets[0], INSS: INSS.recordsets[0], CART: CART.recordsets[0] })
      }
    })
  } catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password && r.permissions.propostas.lista) < 0) return res.status(200).json({ status: false, error: `Você não possui permissão para acessar esse sistema!` })
      return res.status(200).send({ MongoDB: table.propostas })
    })
    console.log(`[POST /propostas/listas] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = lista