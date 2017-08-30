const $ = require('../$')
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
   * @param {Object} package_config 
   * @param {String} job_name 
   */
  constructor(agenda, options, package_config) {
    this._agenda = agenda
    this._options = options
    this.package_config =
      $._.defaults(package_config, this._options.default_job_config)
    this.job_name = this.package_config.job_name
    this.package_name = this.package_config.package_name
    this._log = null
    this._job = null
    this._process = null
    this._process_tree = null
    this.execJob = this.execJob.bind(this)
    this._initLog()     // this._log
    this._defineJob()   // this._job
  }
  /**
   * 返回当前Job工作状态
   * @returns {Boolean}
   */
  isRunning() {
    return (this._process || this._process_tree)
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
    if (this.isRunning()) {
      return
    }
    this._outputConfigs()
    try {
      await $.retry(async (retry, number) => {
        $.log.info(`[+][JOB] Running job: [${this.job_name}] ${number} times`)
        try {
          // npm start wrong or job timeout will throw an Error,
          // we will wait for the wrong process stopping, 
          // then promiseRetry will catch the Error and retry the job.
          await this._execNpmStart().timeout(this.package_config.timeout)
        } catch (err) {
          $.log.error('[-][JOB] Detected Error:', this.job_name)
          $.log.error(err)
          await this._abort()
          retry(err)
        } finally {
          // npm start success or fail, always mark the process stopped.
          this._process = null
        }
      }, this.package_config)
      // after retry, the job successed, tell the timeline the job is done.
      done()
    } catch (err) {
      // after retry, still have error, or the wrong process would not stopped.
      // tell the timeline the job is wrong with err.
      done(err)
    }
  }

  /**
   * 停止进程树
   * 首先初始化进程树，然后传递退出信号
   * 在等待一定时间后，检查进程树是否退出完全
   * 如果没有退出，则抛出异常，直接结束这次任务
   * stop函数结束后进程树即被释放，以此来标志该进程是否在退出中
   */
  async _abort() {
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
    await this._process_tree.sendSignal(this._options.process_exit_signal)
    let remain_pids = await this._process_tree
      .checkAlive(this._options.process_check_delay)
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
   * 初始化日志路径
   */
  _initLog() {
    let job_log_dir =
      $.path.resolve(this._options.log_dir, this.package_name)
    if (!$.fs.existsSync(job_log_dir)) {
      $.fs.mkdirSync(job_log_dir)
    }
    this._log = $.fs.openSync($.path.resolve(job_log_dir,
      `${this.job_name}-${$.moment().format('YYYY-MM-DD')}`), 'a')
  }

  /**
   * 定义任务，指定要执行的函数以及定时至数据库
   */
  _defineJob() {
    this._agenda.define(this.job_name, this.package_config, this.execJob)
    this._job = this._agenda.every(
      this.package_config.schedule, this.job_name, {},
      { timezone: this._options.timezone })
    $.log('[+][TIMELINE] Timing job successed:', this.job_name)
  }

  /**
   * 输出这次任务启动的参数
   */
  _outputConfigs() {
    $.log.info('[+][JOB] Startup prameters',
               '\n\t--retries:', this.package_config.retries,
               '\n\t--timeout:', this.package_config.timeout,
               '\n\t--factor:', this.package_config.factor,
               '\n\t--minTimeout:', this.package_config.minTimeout,
               '\n\t--maxTimeout:', this.package_config.maxTimeout)
  }

  /**
   * 执行'npm start'并保存ChildProcess实例，注册监听事件
   * @returns {Promise}
   */
  _execNpmStart() {
    return new $.Promise((resolve, reject) => {
      this._process = $.child_process.spawn('npm', ['start'], {
        cwd: $.path.resolve(this._options.npm_dir, this.package_name),
        detached: true,
        // TODO 重定向到文件
        stdio: ['ignore', this._log, this._log],
      })
      this._process.on('exit', (code, signal) => {
        // 任务失败 抛出异常
        if (code === 1) {
          reject(new Error('Job Failed, exit with code 1.'))
          // 任务成功
        } else if (code === 0) {
          resolve()
          // 任务被强行退出
        } else if (signal === this._options.process_exit_signal) {
          resolve(signal)
          // 未知退出状态
        } else {
          reject(new Error('Unknown exit status.'))
        }
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
