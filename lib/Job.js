const $ = require('../$')
const promiseRetry = require('promise-retry')
const ProcessTree = require('./ProcessTree')

/**
 * 用于执行任务，与Agenda数据库互通
 * 存储执行任务后的ChildProcess对象
 * 存储每个任务的配置
 * 用this._process 标志当前任务是否在执行
 * 用this._process_tree标志当前任务是否在退出
 */
class Job {
  /**
   * 初始化Job实例
   * define的最后一个参数指定了要执行的函数
   * every操作将任务定时并存储到mongdob中
   * @param {Agenda} agenda 
   * @param {Object} config 
   * @param {String} job_name 
   */
  constructor(agenda, config, job_name) {
    this.job_name = job_name
    this.package_name = job_name.split(' ')[0]
    this.config = $._.defaults(config, $.conf.timeline.default_job_config)
    this._process_tree = null
    this._agenda = agenda
    this._process = null
    this.execJob = this.execJob.bind(this)
    // 定义和定时任务，define最后一个参数为任务要执行的函数
    agenda.define(this.job_name, this.config, this.execJob)
    this._job = agenda.every(config.schedule, job_name, {},
      { timezone: $.conf.timeline.timezone })
    $.log('[+][TIMELINE] Timing job successed:', job_name)
  }

  /**
   * 从MongoDB中删除任务
   * @returns {Promise}
   */
  async remove() {
    try {
      await this._remove()
      $.log(`[+][TIMELINE] Remove job succesed: [${this.job_name}]`)
    } catch (err) {
      $.log.error(`[-][TIMELINE] Remove job failed: [${this.job_name}]`)
    }
  }
  /**
 * 执行任务
 * 当任务出错或超时后会尝试停止任务进程
 * 如果停止任务进程成功，会重试任务
 * 如果无法停止任务进程会抛出错误，不再重试，直接判定当前任务失败
 * @param {Object} job 
 * @param {Function} done
 */
  async execJob(job, done) {
    // 如果当前任务进程正在退出，则不执行任务
    if (this._process_tree) {
      return
    }
    // output the startup parameters
    this._outputConfigs()
    try {
      await promiseRetry(async (retry, number) => {
        $.log.info(`[+][JOB] Running job: [${this.job_name}] ${number} times`)
        try {
          await this._execNpmStart().timeout(this.config.timeout)
        } catch (err) {
          $.log.error('[-][JOB] Detected Error:', this.job_name)
          $.log.error(err)
          await this._stop()
          retry(err)
        } finally {
          this._process = null
        }
      }, this.config)
      done()
    } catch (err) {
      done(err)
    }
  }
  /**
   * 外部中断任务，任务有可能正在退出过程中
   * 外部捕获不到这一进度
   * 所以使用setTimeout模拟stop过程
   */
  async abort() {
    if (this._process_tree) {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, $.conf.timeline.process_check_delay + 1000)
      })
    }
    await this._stop()
  }

  /**
   * 停止进程树
   * 首先初始化进程树，然后传递退出信号
   * 在等待一定时间后，检查进程树是否退出完全
   * 如果没有退出，则抛出异常，直接结束这次任务
   * stop函数结束后进程树即被释放，以此来标志该进程是否在退出中
   */
  async _stop() {
    // 如果当前任务不在执行或正在退出，不执行stop
    if (!this._process || this._process_tree) {
      return
    }
    // 存储pid, 在退出时触发npm failed会使this._process=null, 防止pid丢失
    let pid = this._process.pid
    $.log.info(
      '[!][JOB] Aborting the process:', this.job_name, pid)
    this._process_tree = new ProcessTree(pid)
    await this._process_tree.init()
    await this._process_tree.sendSignal($.conf.timeline.process_exit_signal)
    let remain_pids = await this._process_tree
      .waitForCheckAlive($.conf.timeline.process_check_delay)
    this._process_tree = null
    if (remain_pids.length) {
      throw new Error(
        'Can not stop the process! Please handle it manually:' + remain_pids)
    } else {
      $.log.info(
        '[!][JOB] Process success abort:', this.job_name, pid)
    }
  }

  /**
   * 输出这次任务启动的参数
   */
  _outputConfigs() {
    $.log.info('[+][JOB] Startup prameters',
               '\n\t--retries:', this.config.retries,
               '\n\t--timeout:', this.config.timeout,
               '\n\t--factor:', this.config.factor,
               '\n\t--minTimeout:', this.config.minTimeout,
               '\n\t--maxTimeout:', this.config.maxTimeout)
  }

  /**
   * 执行'npm start'并保存ChildProcess实例，注册监听事件
   * @returns {Promise}
   */
  _execNpmStart() {
    return new $.Promise((resolve, reject) => {
      this._process = $.child_process.exec('npm start', {
        cwd: $.path.resolve($.conf.timeline.npm_dir, this.package_name),
        env: process.env,
      }, (err, stdout, stderr) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
      // TODO 分清stdout和stderr的日志
      this._process.stdout.on('data', (data) => {
        $.log.debug(data)
      })
      this._process.stderr.on('data', (data) => {
        $.log.error(data)
      })
    })
  }

  /**
   * 从MongoDB中移除当前job
   * @returns {Promise}
   */
  _remove() {
    return new $.Promise((resolve, reject) => {
      this._job.remove((err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }
}

module.exports = Job
