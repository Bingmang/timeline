const $ = require('../$')
const Job = require('./Job')

/**
 * 用于扫描工作目录
 * 存储工作路径
 * 存储任务配置
 * 存储实例化后的每个Job对象
 */
class JobQueue {
  constructor(agenda, options) {
    this._agenda = agenda
    this._options = options
    this._package_dirs = []
    this._old_package_configs = {}
    this.package_configs = {}
    this.jobs = {}
    this.updateJobQueue()
  }

  updateJobQueue() {
    // init package_configs
    this._readNpmDir()
    this._scanConfigs()
    this._operateDifferentJobs()
  }

  /**
   * 读取npm工作目录下的文件夹并保存到this._package_dirs
   */
  _readNpmDir() {
    let package_dirs = $.fs.readdirSync(this._options.npm_dir)
    $._.remove(package_dirs, (package_dir) => {
      return package_dir[0] === '.'
    })
    this._package_dirs = package_dirs
  }

  /**
   * 读取每个package中的timeline.json和版本号保存到this.package_configs
   */
  _scanConfigs() {
    this._old_package_configs = $._.clone(this.package_configs)
    this.package_configs = {}
    $._.forEach(this._package_dirs, (package_name) => {
      try {
        // read package.json
        let package_json = JSON.parse($.fs.readFileSync($.path.resolve(
          this._options.npm_dir, package_name, 'package.json')))
        // read timeline.json
        let timeline_json = JSON.parse($.fs.readFileSync($.path.resolve(
          this._options.npm_dir, package_name, this._options.config_name)))
        // read package version
        let job_name = package_name + '-' + package_json.version
        timeline_json['job_name'] = job_name
        timeline_json['package_name'] = package_name
        // check multiple job or single job
        if (timeline_json.jobs) {
          this._multipleJobHandler(timeline_json)
        } else {
          this._singleJobHandler(timeline_json)
        }
      } catch (err) {
        throw new Error('[-][JOB] Missing config:', package_name)
        $.log.error(err)
        return
      }
    })
  }

  /**
   * 处理多任务的timeline.json, 为每个job命名区分后传入_singleJobHandler
   * @param {Object[]} timeline_json 
   */
  _multipleJobHandler(timeline_json) {
    $._.forEach(timeline_json.jobs, (each_config) => {
      if (!each_config.script) {
        throw new Error('missing script')
      }
      let package_config = $._.clone(each_config)
      package_config['job_name'] = 
        timeline_json.job_name + '-' + each_config.name
      package_config['package_name'] = timeline_json.package_name
      this._singleJobHandler(package_config)
    })
  }

    /**
     * 处理单任务的timeline.json, 确认参数后将配置文件写入this.package_configs
     * @param {Object} package_config 
     */
  _singleJobHandler(package_config) {
    if (!package_config.schedule
    || !package_config.timeout
    || !package_config.maintainer) {
      throw new Error('missing parameters')
    }
    this.package_configs[package_config.job_name] = $._.clone(package_config)
  }

  /**
   * 每次扫描目录后，对比新旧任务，删除或增加新任务到this.jobs
   */
  _operateDifferentJobs() {
    let to_remove_jobs = []
    let to_define_jobs = []
    let diff_jobs = $._.xor(
      $._.keys(this._old_package_configs), $._.keys(this.package_configs))
    $._.forEach(diff_jobs, (job_name) => {
      // 任务还能被扫描到，判定为新任务， 否则为待删除的任务
      if (this.package_configs[job_name]) {
        to_define_jobs.push(job_name)
      } else {
        to_remove_jobs.push(job_name)
      }
    })
    $._.forEach(to_remove_jobs, (job_name) => {
      this.jobs[job_name].remove()
      this.jobs[job_name] = null
      delete this.jobs[job_name]
    })
    $._.forEach(to_define_jobs, (job_name) => {
      this.jobs[job_name] =
        new Job(this._agenda, this._options, this.package_configs[job_name])
    })
  }
}

module.exports = JobQueue
