const conf = require('./conf')
const Timeline = require('.')
// express
const Agendash = require('timeline-agendash')
const express = require('express')
const serveIndex = require('serve-index')
const serveStatic = require('serve-static')

let app = express()
let router = express.Router()
let timeline = new Timeline(conf.timeline)
timeline.start()

app.set("view engine", "ejs")
app.set('views', './views')
app.set("view options", { "open": "{{", "close": "}}" })
app.use(express.static('public'))
app.use('/', Agendash(timeline.agenda, {
  title: 'TIMELINE: ' + process.pid,
}))
app.use('/log', serveIndex(conf.timeline.log_dir, {
  icons: true,
}))
app.use('/log', serveStatic(conf.timeline.log_dir))
module.exports = app

function graceful() {
  timeline.stop()
}

process.on('SIGTERM', graceful)
process.on('SIGINT', graceful)
