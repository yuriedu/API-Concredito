console.log(`[Dashboard] => Starting...`)
require('dotenv-safe').config();
const bodyparser = require("body-parser");
const express = require("express");
const { MSSQL, MongoDB } = require('./src/Utils/database');
const routes = require('./src/Routes/routes')
var logs = []

express()
  .use(require('cors')())
  .use(express.json())
  .use(bodyparser.json())
  .use(bodyparser.json({ limit: '3mb' }))
  .use(bodyparser.urlencoded({ extended: false }))

  .get('*', (req, res) => res.status(200).json({ status: 'online', path: '/api', version: '1.0.0' }))
  .post('/verifyLogin', async function(req, res) { routes.verifyLogin(req, res) })
  .post('/refresh', async function(req, res) { routes.refresh(req, res) })
  .post('/cadastrar', async function(req, res) { routes.cadastrar(req, res, logs) })
  .post('/verifySituation', async function(req, res) { routes.verifySituation(req, res, logs) })
  .listen(process.env.PORT, function (err) {
    if (err) return console.log(`[Dashboard] => Error Loading:\n${err}`)
    console.log(`[Dashboard] => Successfully Loaded!`)
  });