const $ = require('../$')
const updateJobsQueue = require('./_timeline/updateJobsQueue')
const safeShutdown = require('./_timeline/safeShutdown')
let timeline = new $.Agenda($.conf.timeline)

let package_configs = {}

timeline.on('ready', () => {
  $.log('[+][TIMELINE] Successful startup!')
  package_configs = updateJobsQueue(timeline, package_configs)
  // 指定扫描工作目录的时间                                                                                                                                                                                                                                                               
  setInterval(() => {
    package_configs = updateJobsQueue(timeline, package_configs)
  }, $.conf.timeline.scan_dir_schedule)
  // 删除这次没有被define的jobs
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
  let maintainer = $._.get(package_configs[job_name], 'maintainer')
  if (maintainer) {
    $.alarmWechat(maintainer,
      `[JD-TIMELINE] Job failed:\n${job_name}\n${error}`)
  }
})

// exit
function graceful() {
  safeShutdown(timeline)
}

process.on('SIGTERM', graceful)
process.on('SIGINT', graceful)

module.exports = timeline
