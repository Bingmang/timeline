const $ = require('../$')
const updateJobsQueue = require('./_timeline/updateJobsQueue')
const safeShutdown = require('./_timeline/safeShutdown')
const NPM_DIR = $.config.timeline.npm_dir
const SCAN_DIR_SCHEDULE = $.config.timeline.scan_dir_schedule
const CONFIG_NAME = $.config.timeline.config_name
const MAINTAINER = $.config.timeline.maintainer

let timeline = new $.Agenda($.config.timeline)


timeline.on('ready', () => {
  let old_package_configs = {}
  let package_configs = updateJobsQueue(
    timeline, NPM_DIR, CONFIG_NAME, old_package_configs)
  // 每分钟扫描一次工作路径                                                                                                                                                                                                                                                                   
  setInterval(() => {
    old_package_configs = package_configs
    package_configs = updateJobsQueue(
      timeline, NPM_DIR, CONFIG_NAME, old_package_configs)
  }, SCAN_DIR_SCHEDULE)
  // remove old jobs
  timeline.purge((err, num_removed) => {
    $.log(`[-][TIMELINE] Old jobs have been removed: [${num_removed}]`)
  })
  timeline.start()
})

timeline.on('start', (job) => {
  let job_name = $._.get(job, 'attrs.name')
  $.log.info(`[+][JOB] Start job: [${job_name}]`)
})

timeline.on('success', (job) => {
  let job_name = $._.get(job, 'attrs.name')
  $.log.info(`[+][JOB] Finish job: [${job_name}]`)
})

timeline.on('fail', (error, job) => {
  let job_name = $._.get(job, 'attrs.name')
  $.log.error(`[-][JOB] Fail job: [${job_name}]`)
  $.log.error('[-][JOB] Fail time:', job.attrs.failedAt)
  $.log.error(error)
  $.alarmWechat(MAINTAINER,
    `[JD-TIMELINE] Job failed:\n${job_name}\n${error}`)
})

// exit
function graceful() {
  safeShutdown(timeline)
}

process.on('SIGTERM', graceful)
process.on('SIGINT', graceful)

module.exports = timeline
