const $ = require('../../$')
const LOCAL_TIMEZONE = $.conf.timeline.timezone
/**
 * 定义每个任务的行为(定时)
 */
module.exports = function timingJobs(timeline, job_configs) {
  $._.map(job_configs, (package_config, package_name) => {
    timeline.every(
      package_config.schedule, package_name,
      {}, { timezone: LOCAL_TIMEZONE }, () => {
        // Success
        $.log(`[+][TIMELINE] Timing job success: [${package_name}]`)
      })
  })
}