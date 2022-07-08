const { MSSQL, MongoDB } = require('../../Utils/database');
const moment = require(`moment`);
moment.locale("pt-BR");

const edit = async (req, res, queue) => {
  try {
    if (req.body.funcionario) {
      if (req.body.user && req.body.password && (req.body.save || req.body.newPassword)) {
        MongoDB.findById('db', async (error, table) => {
          if (table.users.find(r=>r._id == req.body.user && r.password == req.body.password && r.permissions.administrativo.funcionarios)) {
            if (table.users.find(r=>r._id == req.body.funcionario)) {
              if (req.body.newPassword) table.users.find(r=>r._id == req.body.funcionario).password = req.body.newPassword
              if (req.body.save) {
                table.users.find(r=>r._id == req.body.funcionario).permissions.administrativo.funcionarios = req.body.save.administrativo.funcionarios == 'true' ? true : false
                table.users.find(r=>r._id == req.body.funcionario).permissions.administrativo.relatorios = req.body.save.administrativo.relatorios== 'true' ? true : false
                table.users.find(r=>r._id == req.body.funcionario).permissions.propostas.lista = req.body.save.propostas.lista== 'true' ? true : false
                table.users.find(r=>r._id == req.body.funcionario).permissions.propostas.cadastrar = req.body.save.propostas.cadastrar== 'true' ? true : false
                table.users.find(r=>r._id == req.body.funcionario).permissions.consultas.fgts = req.body.save.consultas.fgts== 'true' ? true : false
                table.users.find(r=>r._id == req.body.funcionario).permissions.consultas.lotes = req.body.save.consultas.lotes== 'true' ? true : false
              }
              table.save()
              return res.status(200).json({ status: true })
            } else return res.status(200).json({ status: false, error: `Funcionario não encontrado...` })
          } return res.status(200).json({ status: false, error: `Você não tem permissão para fazer isso...` })
        })
      } else return res.status(200).json({ status: false, error: `Algum campo está faltando...` })
    } else {
      if (req.body.user && req.body.password && req.body.newPassword) {
        MongoDB.findById('db', async (error, table) => {
          if (table.users.find(r=>r._id == req.body.user && r.password == req.body.password)) {
            table.users.find(r=>r._id == req.body.user && r.password == req.body.password).password = req.body.newPassword
            table.save()
            return res.status(200).json({ status: true })
          } return res.status(200).json({ status: false, error: `Sua senha atual está invalida...` })
        })
      } else return res.status(200).json({ status: false, error: `Algum campo está faltando...` })
    }
  }catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(200).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /administrativo/edit] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = edit