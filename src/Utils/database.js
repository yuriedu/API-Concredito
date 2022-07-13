const mssql = require('mssql');
const MSSQL = async () => {
  return await mssql.connect({
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_NAME,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: true, enableArithAbort: true, trustServerCertificate: true }
  });
}

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, error => {
  if (error) {
    console.log(`[Dashboard] => Erro MongoDB: ${error}`);
    return process.exit(1);
  }
  return console.log(`[Dashboard] => MongoDB Connected!`);
});

var propostasSchema = new mongoose.Schema({
  _id: String,
  status: Boolean,
  NomeCliente: String,
  Cpf: String,
  rg: String,
  TelefoneConvenio: String,
  Email: String,
  Datanascimento: String,
  sexo: String,
  Cep: String,
  Cidade: String,
  Bairro: String,
  UF: String,
  Endereco: String,
  EndNumero: String,
  NomeMae: String,
  CodBancoCliente: String,
  Agencia: String,
  ContaCorrente: String,
  Poupanca: String,
  Prazo: Number,
  ValorParcela: Number,
  BancoContrato: String,
  Orgao: String,
  Tabela: String,
  Valor: Number,

  CodigoContrato: Number,
})

var ConsultFgtsBanksSchema = new mongoose.Schema({
  _id: String,
  saldoTotal: String,
  saldoLiberado: String,
  data: String,
  parcelas: String,
})
var ConsultFgtsSchema = new mongoose.Schema({ _id: String, banks: [ConsultFgtsBanksSchema] })
var userSchema = new mongoose.Schema({
  _id: String,
  password: String,
  permissions: {
    administrativo: {
      funcionarios: Boolean,
      relatorios: Boolean,
    },
    propostas: {
      lista: Boolean,
      cadastrar: Boolean,
    },
    consultas: {
      fgts: Boolean,
      lotes: Boolean
    }
  },
  counts: {
    consultFgts: [ConsultFgtsSchema],
    register: Number,
  }
})
var mongoSchema = new mongoose.Schema({
  _id: String,
  users: [userSchema],
  propostas: [propostasSchema]
})

module.exports = { MSSQL, MongoDB: mongoose.model('db', mongoSchema)  }