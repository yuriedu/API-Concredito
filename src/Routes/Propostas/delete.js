const { MSSQL, MongoDB } = require('../../Utils/database');

const create = async (req, res) => {
  try {
    if (!req.body.user || !req.body.password || !req.body.proposta) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Informações necessarias estão faltando...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password &&  r.permissions.propostas.lista) < 0) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Você não possui permissão para acessar esse sistema!` })

      if (table.propostas.find(r=>r._id == req.body.proposta.Cpf)) {
        table.propostas.splice(table.propostas.findIndex(r=> r._id == req.body.proposta.Cpf), 1)
        table.save()
        return res.status(200).json({ status: true })
      } else return res.status(200).json({ status: false, error: `Proposta não encontrada no meu segundo banco de dados!` })
    })
  } catch(err) {
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /propostas/create] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = create