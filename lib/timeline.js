const $ = require('../$')
const updateJobsQueue = require('./_timeline/updateJobsQueue')
const timingJobs = require('./_timeline/timingJobs')
const NPM_DIR = $.config.timeline.npm_dir
const CONFIG_NAME = $.config.timeline.config_name

// 初始化timeline
let timeline = new $.Agenda($.config.timeline)


// 三、定义任务行为
timeline.on('ready', () => {
  let old_package_configs = {}
  let package_configs = updateJobsQueue(
    timeline, NPM_DIR, CONFIG_NAME, old_package_configs)
  // 一、遍历~/npm目录下的所有文件夹, 并解析配置文件
  // TODO                                                                                                                                                                                                                                                                                                  
  setInterval(() => {
    old_package_configs = package_configs
    package_configs = updateJobsQueue(
      timeline, NPM_DIR, CONFIG_NAME, old_package_configs)
  }, 10000)
  // remove old jobs
  timeline.purge((err, num_removed) => {
    $.log(`[-][TIMELINE] Old jobs have been removed: [${num_removed}]`)
  })
  timeline.start()
})

// 四、监听timeline事件
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
})

// exit
function graceful() {
  timeline.stop(() => {
    $.log('[!][TIMELINE] System shutdown')
    process.exit(0)
  })
}

process.on('SIGTERM', graceful)
process.on('SIGINT', graceful)

module.exports = timeline
