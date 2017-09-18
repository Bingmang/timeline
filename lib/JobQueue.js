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
   * 扫描每个目录下的package.json和timeline.json
   */
  _scanConfigs() {
    this._old_package_configs = $._.clone(this.package_configs)
    this.package_configs = {}
    $._.forEach(this._package_dirs, (package_dir) => {
      try {
        // read package.json
        let package_json = JSON.parse($.fs.readFileSync($.path.resolve(
          this._options.npm_dir, package_dir, 'package.json')))
        // read timeline.json
        let timeline_json = JSON.parse($.fs.readFileSync($.path.resolve(
          this._options.npm_dir, package_dir, this._options.config_name)))
        // handle configs
        this._configHandler(package_dir, package_json, timeline_json)
      } catch (err) {
        $.log.error(
          '[-][JOB] An error occurred while reading configs:', package_dir)
        $.log.error(err)
        return
      }
    })
  }

  /**
   * 读取配置文件, 并保存在内存中
   * @param {string} package_dir 
   * @param {object} package_json 
   * @param {object} timeline_json 
   */
  _configHandler(package_dir, package_json, timeline_json) {
    if (!timeline_json.jobs) {
      throw new Error('Timeline.json is wrong, please check!')
    }
    // for each script config
    $._.forEach(timeline_json.jobs, (script_config) => {
      let required_params =
        ['name', 'script', 'schedule', 'timeout', 'maintainer']
      if (!$._.every(required_params, $._.partial($._.has, script_config))) {
        throw new Error('Missing parameters in timeline.json')
      }
      let job_name =
        `${package_json.name}@${package_json.version}-${script_config.name}`
      // put the config into this.package_configs
      this.package_configs[job_name] = $._.merge(script_config, {
        job_name: job_name,
        package_dir: package_dir,
      })
    })
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
