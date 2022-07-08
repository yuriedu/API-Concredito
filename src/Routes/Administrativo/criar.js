const { MSSQL, MongoDB } = require('../../Utils/database');
const moment = require(`moment`);
moment.locale("pt-BR");

const criar = async (req, res, queue) => {
  try {
    MongoDB.findById('db', async (error, table) => {
      if (table.users.find(r=>r._id == req.body.user && r.password == req.body.password && r.permissions.administrativo.funcionarios)) {
        if (table.users.find(r=>r._id == req.body.newUser)) return res.status(200).json({ status: false, error: `Já existe um funcionario com esse nome...` })
        table.users[table.users.length] = {
          _id: req.body.newUser,
          password: req.body.newPass,
          permissions: {
            administrativo: {
              funcionarios: false,
              relatorios: false,
            },
            propostas: {
              lista: false,
              cadastrar: false,
            },
            consultas: {
              fgts: false,
              lotes: false
            }
          },
        }
        table.save()
        return res.status(200).json({ status: true })
      } else return res.status(200).json({ status: false, error: `Você não tem permissão para acessar esse sistema...` })
    })
  }catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /administrativo/criar] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = criar