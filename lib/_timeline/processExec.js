const $ = require('../../$')
const jobRetryWrapper = require('./jobRetryWrapper')
const execAsync = $.Promise.promisify($.child_process.exec)
const NPM_DIR = $.config.timeline.npm_dir

/**
 * 检查目录存在后，在子Shell中运行'npm start'
 * @param {Object} job
 * @param {Function} done
 * @param {Integer} exec_option.timeout
 * @return {undefined}
 */
module.exports = async function processExec(job, done, exec_option) {
  // 检测目录是否存在
  let package_name = job.attrs.name.split(' ')[0]
  let current_work_dir = $.path.resolve(NPM_DIR, package_name)
  if (!$.fs.existsSync(current_work_dir)) {
    done(new Error(
      `[-][JOB] Working path dos not exist: [${package_name}]`))
  }
  let execAsyncRetry = jobRetryWrapper(job, execAsync, exec_option)
  try {
    // 任务会自动重试指定次数，失败后抛出异常
    let result = await execAsyncRetry('npm start', {
      cwd: current_work_dir,
      env: process.env,
    })
    done()
  } catch (err) {
    // 经过指定重试次数还是失败了
    // 抛出给timeline 触发fail事件
    done(err)
  }
}