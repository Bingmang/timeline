const agenda = require('../lib/timeline')
const assert = require('assert')

describe('processExec test', function () {
  it('timeline test', (done) => {
    setTimeout(() => {
      agenda.stop(() => {
        done()
      })
    }, 10000)
  })
}) 