const login = require('./login')
const permissions = require('./permissions')

const admFuncionarios = require('./Administrativo/funcionarios')
const admCriar = require('./Administrativo/criar')
const admDeletar = require('./Administrativo/deletar')
const admEdit = require('./Administrativo/edit')
const admLimpar = require('./Administrativo/limpar')

const propostasCreate = require('./Propostas/create')
const propostasChangeFase = require('./Propostas/changeFase')
const propostasDelete = require('./Propostas/delete')
const propostasLista = require('./Propostas/lista')
const propostasRegister = require('./Propostas/register')
const propostasSituation = require('./Propostas/situation')
const propostasGenerator = require('./Propostas/generator')
//const propostasNew = require('./Cadastros/new')

const consultasFGTS = require('./Consultas/fgts')
const consultasQueue = require('./Consultas/queue')
//const consultasLotes = require('./Consultas/lotes')

module.exports = {
  login,
  permissions,
  administrativo: {
    funcionarios: admFuncionarios,
    criar: admCriar,
    deletar: admDeletar,
    edit: admEdit,
    limpar: admLimpar,
  },
  propostas: {
    create: propostasCreate,
    delete: propostasDelete,
    lista: propostasLista,
    register: propostasRegister,
    situation: propostasSituation,
    generator: propostasGenerator,
    changeFase: propostasChangeFase,
    //new: CadastrosNew
  },
  consultas: {
    fgts: consultasFGTS,
    queue: consultasQueue,
    //lotes: consultasLotes,
  }
}