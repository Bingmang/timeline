const $ = require('../../$')
const processExec = require('./processExec')

module.exports = function defineJobs(timeline, job_configs) {
  $._.map(job_configs, (package_config, job_name) => {
    let define_option = $.config.timeline.default_define_option
    let exec_option = $._.defaults(
      package_config, $.config.timeline.default_execute_option)
    // [!] 任务执行在processExec中
    // 无define_option的时候会使用config/timeline.config中的默认参数
    timeline.define(job_name, define_option, async (job, done) => {
      processExec(job, done, exec_option)
    })
  })
}