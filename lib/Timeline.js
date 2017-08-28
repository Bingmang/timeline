const $ = require('../$')
const JobQueue = require('./JobQueue')

/**
 * 用于实例化Agenda对象及JobQueue对象
 * 监听Agenda事件
 */
class Timeline {
  constructor(options) {
    this._options = options
    this.agenda = null
    this._job_queue = null
  }

  /**
   * 初始化agenda并注册监听时间
   */
  start() {
    this.agenda = new $.Agenda(this._options)
    // agenda ready event (trigger when connected mongodb)
    this.agenda.on('ready', () => {
      this._job_queue = new JobQueue(this.agenda, this._options)
      $.log('[+][TIMELINE] Successful startup!')
      setInterval(() => {
        this._job_queue.updateJobQueue()
      }, this._options.scan_dir_schedule)
      this.agenda.purge((err, num_removed) => {
        $.log('[-][TIMELINE] Old jobs have been removed:', num_removed)
      })
      this.agenda.start()
    })
    // agenda start event (trigger when job start)
    this.agenda.on('start', (job) => {
      let job_name = $._.get(job, 'attrs.name')
      $.log.info(`[+][JOB] Start job: [${job_name}]`)
    })
    // agenda success event (trigger when job finished)
    this.agenda.on('success', (job) => {
      let job_name = $._.get(job, 'attrs.name')
      $.log.info(`[+][JOB] Finish job: [${job_name}]`)
    })
    // agenda fail event (trigger when job throw an Error)
    this.agenda.on('fail', (err, job) => {
      let job_name = $._.get(job, 'attrs.name')
      $.log.error(`[-][JOB] Fail job: [${job_name}]`)
      $.log.error('[-][JOB] Fail time:', job.attrs.failedAt)
      $.log.error(err)
      let maintainer =
        $._.get(this._job_queue.package_configs[job_name], 'maintainer')
      $.alarmWechat(maintainer,
        `[JD-TIMELINE] Job failed:\n${job_name}\n${err}`)
    })
  }

  async stop() {
    await this._safeShutdown(this.agenda)
  }

  /**
   * 关闭时转移正在执行的任务到其他进程，并在一定时间后重新执行
   */
  async _safeShutdown() {
    // TODO: 监听SIGINT信号安全的退出timeline进程
    // $.log('[!][TIMELINE] System shutdown ... waiting for job to stop...')
    this.agenda.stop(() => {
      $.log('[!][TIMELINE] Shutdown.')
      process.exit(0)
    })
  }
}

module.exports = Timeline
