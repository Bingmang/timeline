const $ = require('../../$')
const TRANSFER_DELAY = $.config.timeline.transfer_delay

module.exports = safeShutdown

function safeShutdown(timeline) {
  // 找出本机当前正在执行的任务
  let query = {
    lockedAt: { $ne: null },
    lastModifiedBy: $.config.timeline.name,
  }
  timeline.jobs(query, (err, jobs) => {
    if (err) {
      shutdownWrong(err, timeline)
    }
    // 如果本机存在正在执行的任务， 转移这些任务
    if (jobs.length === 0) {
      shutdown(timeline)
    } else {
      transferJobs(timeline, jobs)
    }
  })
}

function transferJobs(timeline, jobs) {
  let itemsProcessed = 0
  $.log('[!][TIMELINE] System shutdown, transfering jobs...')
  $._.forEach(jobs, (job, index) => {
    let job_name = $._.get(job, 'attrs.name')
    job.schedule(TRANSFER_DELAY)
    job.save((err) => {
      if (err) {
        $.log('[-][TIMELINE] Job transfer failed:', job_name)
      }
      $.log('[+][TIMELINE] Job transfer succesed:', job_name)
      itemsProcessed++
      // 全部遍历完了再退出
      if (itemsProcessed === jobs.length) {
        shutdown(timeline)
      }
    })
  })
}

function shutdown(timeline) {
  timeline.stop(() => {
    $.log('[!][TIMELINE] Shutdown.')
    process.exit(0)
  })
}

function shutdownWrong(err, timeline) {
  // ! 很严重的问题， 关闭的时候连接不了数据库， 任务有可能出错，请手动检查
  $.log.error('[-][TIMELINE] System ERROR!',
    'Database and jobs will be wrong, please check manually!\n', err)
  timeline.stop(() => {
    $.log('[!][TIMELINE] Shutdown.')
    process.exit(1)
  })
}
