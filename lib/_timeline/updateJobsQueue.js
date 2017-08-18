const $ = require('../../$')
const defineJobs = require('./defineJobs')
const timingJobs = require('./timingJobs')
const removeJobs = require('./removeJobs')

/**
 * 从npm目录下读取所有配置文件和包的信息
 * 旧信息和新信息对撞后生成两个数组，一个是待删除任务，一个是待定义任务
 * 返回最新的配置信息
 * @param {Agenda} timeline
 * @param {Object} job_configs 
 */
function updateJobsQueue(timeline, job_configs) {
  if (!$.fs.existsSync($.conf.timeline.npm_dir)) {
    return {}
  }
  let old_job_configs = job_configs
  let new_job_configs = {}
  let to_remove_jobs = []
  let to_define_jobs = []
  // 读取工作目录下的所有包, 过滤不必要的文件夹
  let package_dirs = $.fs.readdirSync($.conf.timeline.npm_dir)
  $._.remove(package_dirs, (package_dir) => {
    return package_dir[0] === '.'
  })
  // 对每个包 读取timeline.json和package.json获取参数及版本号 -> new_job_configs
  $._.forEach(package_dirs, (package_name) => {
    try {
      let package_json
      let timeline_json
      let package_info = $.fs.readFileSync($.path.resolve(
          $.conf.timeline.npm_dir, package_name, 'package.json'))
      let timeline_info = $.fs.readFileSync($.path.resolve(
          $.conf.timeline.npm_dir, package_name, $.conf.timeline.config_name))
      package_json = JSON.parse(package_info)
      timeline_json = JSON.parse(timeline_info)
      // 严格检查所有参数
      let job_name = package_name + ' ' + package_json.version
      if (!timeline_json.schedule
      || !timeline_json.timeout
      || !timeline_json.maintainer) {
        throw new Error(`[-][JOB] Missing configuration: [${job_name}`)
      }
      new_job_configs[job_name] = $._.clone(timeline_json)
    } catch (err) {
      $.log.error(`[-][JOB] Read configuration error: [${package_name}]`)
      $.log.error(err)
      return
    }
  })
  // new_job_configs 对比 old_job_configs -> diff_jobs
  let old_jobs = $._.keys(old_job_configs)
  let new_jobs = $._.keys(new_job_configs)
  let diff_jobs = $._.xor(old_jobs, new_jobs)
  // diff_jobs 根据 new_job_configs 挑选-> to_define_jobs, to_remove_jobs
  $._.forEach(diff_jobs, (job_name) => {
    // 任务还能被扫描到，判定为新任务， 否则为待删除的任务
    if (new_job_configs[job_name]) {
      to_define_jobs.push(job_name)
    } else {
      to_remove_jobs.push(job_name)
    }
  })
  // 碰撞出新的需要删除的job
  if (to_remove_jobs.length) {
    // delete new job
    removeJobs(timeline, to_remove_jobs)
  }
  // 碰撞出新的需要定义的job
  if (to_define_jobs.length) {
    let to_update_job_configs = $._.pick(new_job_configs, to_define_jobs)
    console.log(to_update_job_configs)
    defineJobs(timeline, to_update_job_configs)
    timingJobs(timeline, to_update_job_configs)
  }
  return new_job_configs
}


module.exports = updateJobsQueue