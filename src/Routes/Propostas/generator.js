const { MSSQL, MongoDB } = require('../../Utils/database');
const { removeSpaces } = require('../../Utils/functions');

const { BMGCART } = require('../../Controllers/Generators/BMG');

const lista = async (req, res) => {
  try {
    if (!req.body.user || !req.body.password) return res.status(500).json({ status: false, error: `Usuário ou senha não foi informado...` })
    if (!req.body.af || !req.body.bank) return res.status(500).json({ status: false, error: `Campos necessarias não inseridos...` })
    MongoDB.findById('db', async (error, table) => {
      if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.password && r.permissions.propostas.lista) < 0) return res.status(200).json({ status: false, error: `Você não possui permissão para acessar esse sistema!` })
      const pool = await MSSQL();
      const proposta = await pool.request().input('af', req.body.af).execute('pr_getProposta_by_af');
      if (!proposta.recordset[0] || !proposta.recordset[0].Cpf) return res.status(200).json({ status: false, error: `Proposta não encontrada...` })
      for (var key in proposta.recordset[0]) { proposta.recordset[0][key] = await removeSpaces(proposta.recordset[0][key]) }
      var response = false;
      if (req.body.bank == "BMG") {
        proposta.recordset[0].Email = 'concredito@gmail.com'
        removeCaracteresSpeciais(proposta.recordset[0].NomeCliente)
        removeCaracteresSpeciais(proposta.recordset[0].NomeMae)
        removeCaracteresSpeciais(proposta.recordset[0].NomePai)
        response = await BMGCART(proposta.recordset[0]);
      } else return res.status(200).json({ status: false, error: `Não é possivel gerar codigo de cadastros nesse banco!` })
      if (response && response.status) return res.status(200).json(response)
      if (response && response.error) return res.status(200).json(response)
      return res.status(200).json({ status: false, error: `Ocorreu algum erro ao gerar o codigo dessa proposta! Aguarde um tempo e tente novamente, se o erro persistir reporte ao Yuri...` })
    })
  } catch(err){
    if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).json({ status: false, error: `Erro de conexão com o banco de dados! Aguarde um tempo e tente novamente...` })
    console.log(`[POST /cadastros/listas] => ${err}`)
    console.log(err)
    return res.status(500).json(err)
  }
}

module.exports = lista