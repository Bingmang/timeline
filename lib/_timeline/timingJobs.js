const $ = require('../../$')
/**
 * 定义每个任务的行为(定时)
 */
module.exports = function timingJobs(timeline, job_configs) {
  $._.map(job_configs, (package_config, package_name) => {
    timeline.every(
      package_config.schedule, package_name,
      {}, { timezone: $.conf.timeline.timezone }, () => {
        // Success
        $.log(`[+][TIMELINE] Timing job success: [${package_name}]`)
      })
  })
}