const { MSSQL, MongoDB } = require('../../Utils/database');
const moment = require(`moment`);
moment.locale("pt-BR");

const edit = async (req, res, queue) => {
  try {
    MongoDB.findById('db', async (error, table) => {
      if (table.users.find(r=>r._id == req.body.user && r.password == req.body.password && r.permissions.administrativo.funcionarios)) {
        return res.status(200).json({ status: true, users: table.users })
      } else return res.status(200).json({ status: false, error: `Você não tem permissão para acessar esse sistema...` })
    })
  }catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /administrativo/edit] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = edit