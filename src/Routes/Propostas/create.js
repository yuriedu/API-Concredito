const { MSSQL, MongoDB } = require('../../Utils/database');

const create = async (req, res) => {
  try {
    if (!req.body.user || !req.body.password || !req.body.proposta) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Informações necessarias estão faltando...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password &&  r.permissions.propostas.cadastrar) < 0) return res.status(200).json({ status: false, proposta: req.body.proposta, error: `Você não possui permissão para acessar esse sistema!` })
      if (table.propostas.find(r=>r._id == req.body.proposta.Cpf)) return res.status(200).json({ status: false, error: `Esse cliente já tem uma proposta em meu banco de dados!` })
      req.body.proposta.Cep = req.body.proposta.Cep.replace("-","")
      if (req.body.proposta.BancoContrato == "MERCANTIL") return res.status(200).json({ status: false, error: `O Banco MERCANTIL está desativado no momento...` })
      if (req.body.operadores) {
        var salvar = table.propostas[table.propostas.length] = { _id: req.body.proposta.Cpf, status: true }
        for(var key in req.body.proposta) {
          var value = req.body.proposta[key];
          if (value == "on") { value = true }
          if (value == "off" || value == "false") { value = false }
          if (Array.isArray(value)) return res.redirect("/");
          salvar[key] = value
        }
        salvar.Agente = req.body.user
        table.save()
        return res.status(200).json({ status: true })
      } else {
        return res.status(200).json({ status: false, error: `O sistema de cadastor automatico está desativado! Aguarde até que possamos ligar novamente...` })
      }
    })
  } catch(err) {
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /propostas/create] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = create