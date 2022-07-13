console.log(`[Dashboard] => Starting...`)
require('dotenv-safe').config();
const bodyparser = require("body-parser");
const express = require("express");
const { MSSQL, MongoDB } = require('./src/Utils/database');
const routes = require('./src/Routes/routes')
var logs = []
var queue = {
  "FACTA FINANCEIRA": [],
  "BANCO C6": [],
  "MERCANTIL": [],
  "BMG": [],
  "SAFRA": [],
  "PANAMERICANO": []
}

// async function Esteira() {
//   const { FactaEsteira } = require('./src/Controllers/Esteiras/Facta')
//   const pool = await MSSQL();
//   console.log(await FactaEsteira(pool, {af: "ESTEIRA"}))
// }
// Esteira()

// async function test() {
//   var test = `Nome do vendedor: raiani
// Número do vendedor: 995774707
// CPF do cliente: 628.687.055-53
// Nome do Cliente: ANTONIO LEONARDO RODRIGUES SILVA
// Número de telefone: : 71 9375-4323
// Nascimento: : 1976-08-10
// Nome da mãe: : CLEUSA ARGOLO RODRIGUES SILVA
// RG:: 0650299507
// CEP: 42850-000
// Cidade: DIAS D'AVILA
// Logradouro: RUA COLIBRI
// Bairro: NOVA
// Número: 26
// E-mail:: antonio@gmail.com
// Banco de liberação( que o cliente recebe): caixa 104
// Ag. : 2850
// Conta: 0008309751174
// Poupança: Sim
// Banco da operação(que vamos efetuar a operação): banco c6
// Valor prometido: 389,29
// Qtd de parcelas: 10
// Valor de parcela:: 1`
//   test = test.replaceAll(": :",":").replaceAll("::",":")
//   test = test.replaceAll("Nome do vendedor","Agente")
//   test = test.replaceAll("Número do vendedor","CodAgente")
//   test = test.replaceAll("CPF do cliente","Cpf")
//   test = test.replaceAll("Nome do Cliente","NomeCliente")
//   test = test.replaceAll("Número de telefone","TelefoneConvenio")
//   test = test.replaceAll("Nascimento","Datanascimento")
//   test = test.replaceAll("Nome da mãe","NomeMae")
//   test = test.replaceAll("RG","rg")
//   test = test.replaceAll("CEP","Cep")
//   test = test.replaceAll("Cidade","Cidade")
//   test = test.replaceAll("Logradouro","Endereco")
//   test = test.replaceAll("Bairro","Bairro")
//   test = test.replaceAll("Número","EndNumero")
//   test = test.replaceAll("E-mail","Email")
//   test = test.replaceAll("Banco de liberação( que o cliente recebe)","BancoCliente")
//   test = test.replaceAll("Ag. ","Agencia")
//   test = test.replaceAll("Conta","ContaCorrente")
//   test = test.replaceAll("Poupança","Poupanca")
//   test = test.replaceAll("Banco da operação(que vamos efetuar a operação)","BancoContrato")
//   test = test.replaceAll("Valor prometido","Valor")
//   test = test.replaceAll("Qtd de parcelas","Prazo")
//   test = test.replaceAll("Valor de parcela","ValorParcela")
//   test = test.replaceAll(",",".")
//   test = test.replaceAll("'","")
//   test = test.replaceAll('"',"")
//   test = test.replaceAll('\n', ', ')
//   var properties = test.split(', ');
//   console.log(properties)
//   var obj = {};
//   properties.forEach(function(property) {
//       var tup = property.split(':');
//       if (tup[0].slice(0,1) == " ") tup[0] = tup[0].slice(1,tup[0].length)
//       if (tup[1].slice(0,1) == " ") tup[1] = tup[1].slice(1,tup[1].length)
//       obj[tup[0]] = `${tup[1]}`;
//   });
//   console.log(obj)
// }
// test()


express()
  .use(require('cors')())
  .use(express.json())
  .use(bodyparser.json())
  .use(bodyparser.json({ limit: '3mb' }))
  .use(bodyparser.urlencoded({ extended: false }))

  .get('*', (req, res) => res.status(200).json({ status: 'online', path: '/api', version: '1.0.0' }))
  .post('/login', async function(req, res) { routes.login(req, res) })
  .post('/permissions', async function(req, res) { routes.permissions(req, res) })

  .post('/administrativo/funcionarios', async function(req, res) { routes.administrativo.funcionarios(req, res) })
  .post('/administrativo/criar', async function(req, res) { routes.administrativo.criar(req, res) })
  .post('/administrativo/deletar', async function(req, res) { routes.administrativo.deletar(req, res) })
  .post('/administrativo/edit', async function(req, res) { routes.administrativo.edit(req, res) })
  .post('/administrativo/limpar', async function(req, res) { routes.administrativo.limpar(req, res) })

  .post('/propostas/create', async function(req, res) { routes.propostas.create(req, res) })
  .post('/propostas/changeFase', async function(req, res) { routes.propostas.changeFase(req, res) })
  .post('/propostas/delete', async function(req, res) { routes.propostas.delete(req, res) })
  .post('/propostas/lista', async function(req, res) { routes.propostas.lista(req, res) })
  .post('/propostas/register', async function(req, res) { routes.propostas.register(req, res, logs) })
  .post('/propostas/situation', async function(req, res) { routes.propostas.situation(req, res, logs) })
  .post('/propostas/generator', async function(req, res) { routes.propostas.generator(req, res, logs) })
  //.post('/cadastros/new', async function(req, res) { routes.cadastros.new(req, res, logs) })

  .post('/consultas/fgts', async function(req, res) { routes.consultas.fgts(req, res, queue) })
  .post('/consultas/queue', async function(req, res) { routes.consultas.queue(req, res, queue) })
  //.post('/consultas/lotes', async function(req, res) { routes.consultas.lotes(req, res, queue) })

  .listen(process.env.PORT, function (err) {
    if (err) return console.log(`[Dashboard] => Error Loading:\n${err}`)
    console.log(`[Dashboard] => Successfully Loaded!`)
  });