// 包装函数，自动重试，自动判断超时，根据执行的函数名输出错误日志
const promiseRetry = require('promise-retry')
const $ = require('../../$')
const jobRetryWrapper = (job, func, options) => {
  let job_name = $._.get(job, 'attrs.name')
  let retry_options = $._.clone(options)
  // output the startup parameters
  $.log.info('[+][JOB] Startup prameters',
             '\n\t--retries:', retry_options.retries,
             '\n\t--timeout:', retry_options.timeout,
             '\n\t--factor:', retry_options.factor,
             '\n\t--minTimeout:', retry_options.minTimeout,
             '\n\t--maxTimeout:', retry_options.maxTimeout)
  return async (...args) => {
    return promiseRetry(async (retry, number) => {
      $.log.info(`[+][JOB] Running job: [${job_name}] ${number} times`)
      try {
        // using bluebird api detect timeout
        let result = await $.Promise.resolve(func(...args))
          .timeout(retry_options.timeout)
        $.log.debug(result)
        // if has error, will auto retry in <retry_options.retries> times.
      } catch (error) {
        $.log.error(`[-][JOB] Detected error: [${job_name}]\n`, error)
        retry(error)
      }
    }, retry_options)
  }
}
module.exports = jobRetryWrapper