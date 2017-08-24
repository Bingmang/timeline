const $ = require('./$')
const Timeline = require('.')
// express
const Agendash = require('agendash')
const express = require('express')

let app = express()
let router = express.Router()
let timeline = new Timeline($.conf.timeline)
timeline.start()

app.set("view engine", "ejs")
app.set('views', './views')
app.set("view options", { "open": "{{", "close": "}}" })
app.use(express.static('public'))
app.use('/timeline', Agendash(timeline.agenda, {
  title: 'TIMELINE: ' + process.pid,
}))
module.exports = app

function graceful() {
  timeline.stop()
}

process.on('SIGTERM', graceful)
process.on('SIGINT', graceful)
