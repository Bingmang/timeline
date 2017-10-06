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
      console.log('[+][TIMELINE] Successful startup!')
      setInterval(() => {
        this._job_queue.updateJobQueue()
      }, this._options.scan_dir_schedule)
      this.agenda.purge((err, num_removed) => {
        console.log('[-][TIMELINE] Old jobs have been removed:', num_removed)
      })
      this.agenda.start()
    })
    // agenda start event (trigger when job start)
    this.agenda.on('start', (job) => {
      let job_name = $._.get(job, 'attrs.name')
      console.log(`[+][JOB] Start job: [${job_name}]`)
    })
    // agenda success event (trigger when job finished)
    this.agenda.on('success', (job) => {
      let job_name = $._.get(job, 'attrs.name')
      console.log(`[+][JOB] Finish job: [${job_name}]`)
    })
    // agenda fail event (trigger when job throw an Error)
    this.agenda.on('fail', (err, job) => {
      let job_name = $._.get(job, 'attrs.name')
      console.error(`[-][JOB] Fail job: [${job_name}]`)
      console.error('[-][JOB] Fail time:', job.attrs.failedAt)
      console.error(err)
    })
  }

  async stop() {
    await this._safeShutdown(this.agenda)
  }

  /**
   * 关闭时轮询任务队列，当前进程没有任务时再退出
   */
  async _safeShutdown() {
    this.agenda.stop(() => {
      console.log(`[!][TIMELINE] Process ${process.pid} is shuting down... ` +
            `waiting for job finished.`)
    })
    setInterval(() => {
      let isJobRunning = false
      $._.forEach(this._job_queue.jobs, (job) => {
        if (job.isRunning()) {
          isJobRunning = true
        }
      })
      if (!isJobRunning) {
        process.exit(0)
      }
    }, 1000)
  }
}

module.exports = Timeline
