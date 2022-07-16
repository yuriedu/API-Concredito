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

async function Esteira() {
  const pool = await MSSQL();
  // const { FactaEsteira } = require('./src/Controllers/Esteiras/Facta')
  // await FactaEsteira(pool, {af: "FACTA ESTEIRA"})
  // const { C6Esteira } = require('./src/Controllers/Esteiras/C6')
  // await C6Esteira(pool, {af: "C6 ESTEIRA"})

  // const { BMGEsteira } = require('./src/Controllers/Esteiras/BMG')
  // await BMGEsteira(pool, {af: "BMG ESTEIRA"})
}
Esteira()


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