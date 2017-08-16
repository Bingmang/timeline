const $ = require('./$')
// express
const Agendash = require('agendash')
const express = require('express')

let app = express()
let router = express.Router()

app.set("view engine", "ejs")
app.set('views', './views')
app.set("view options", { "open": "{{", "close": "}}" })

app.use(express.static('public'))
app.use('/timeline', Agendash(require('./lib/timeline'),{
  title: 'TIMELINE: ' + process.pid,
}))
module.exports = app