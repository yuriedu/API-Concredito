const { MSSQL, MongoDB } = require('../../Utils/database');
const moment = require(`moment`);
moment.locale("pt-BR");

const deletar = async (req, res, queue) => {
  try {
    MongoDB.findById('db', async (error, table) => {
      if (table.users.find(r=>r._id == req.body.user && r.password == req.body.password && r.permissions.administrativo.funcionarios)) {
        if (table.users.find(r=>r._id == req.body.funcionario)) {
          table.users.splice(table.users.findIndex(r=> r._id == req.body.funcionario), 1)
          table.save()
          return res.status(200).json({ status: true })
        } else return res.status(200).json({ status: false, error: `Funcionario não encontrado...` })
      } else return res.status(200).json({ status: false, error: `Você não tem permissão para acessar esse sistema...` })
    })
  }catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /administrativo/deletar] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = deletar