const agenda = require('../lib/agenda')
const assert = require('assert')

describe('processExec test', function () {
  it('agenda test', (done) => {
    setTimeout(() => {
      agenda.stop(() => {
        done()
      })
    }, 10000)
  })
}) 