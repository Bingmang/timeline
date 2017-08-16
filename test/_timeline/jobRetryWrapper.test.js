const jobRetryWrapper = require('../../lib/_agenda/jobRetryWrapper')
const assert = require('assert')

// the function will throw <times> errors.
let count = 0
function throwTimesErrors(times) {
  if (count < times) {
    count++
    return Promise.reject(new Error('fail the first two times'))
  } else {
    count = 0
    return Promise.resolve('succeed')
  }
}

describe('jobRetryWrapper test', function () {
// basic test
describe('basic test', function () {
  it('passed after try 3 times', async () => {
    let throwTimesErrorsRetry = jobRetryWrapper(
      throwTimesErrors, {
        retries: 3,
        factor: 1,
        minTimeout: 10,
        maxTimeout: 100,
      })
    await throwTimesErrorsRetry(2)
  })
  it('not passed after try 3 times', async () => {
    let throwTimesErrorsRetry = jobRetryWrapper(
      throwTimesErrors, {
        retries: 3,
        factor: 1,
        minTimeout: 10,
        maxTimeout: 100,
      })
    // will throw Error 4 times, expect throw an error
    let have_error = false
    try {
      await throwTimesErrorsRetry(4)
    } catch (error) {
      have_error = true
    }
    assert(have_error)
  })
  it('default options test', async () => {
    let throwTimesErrorsRetry = jobRetryWrapper(throwTimesErrors, {})
    await throwTimesErrorsRetry(0)
  })
})
})

