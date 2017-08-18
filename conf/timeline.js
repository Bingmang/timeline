// timeline configs
module.exports = {
  name: 'Timeline-' + process.env.ENV + ' ' + process.pid,
  // mongodb
  db: {
    address: require('./_getMongoConfig')('dbp'),
    collection: 'timelineJobs',
  },
  // npm dir
  npm_dir: process.env.HOME + '/npm',
  config_name: 'timeline.json',     // 配置文件的名字,
  // default options
  scan_dir_schedule: 30000,                       // 扫描目录的时间间隔
  transfer_delay: 'in 10 seconds',                // 进程结束后转移本机任务， 指定下次执行任务的时间
  maxConcurrency: 1,                              // 所有timeline进程所能执行的任务数量
  lockLimit: 1,                                   // 同一时间内任务队列中最大数量
  timezone: 'Asia/Shanghai',                      // 定时任务所用到的时区
  defaultConcurrency: 1,                          // 单个任务在一个时间内同时执行的数量
  defaultLockLimit: 0,                            // 当前锁定任务的最大数量， 0代表无限
  defaultLockLifetime: 1200000,                   // 20 mins
  // job config: 
  default_define_option: {
    priority: 'normal',                           // 当前任务优先级都为normal
  },
  default_execute_option: {
    retries: 2,                                   // 任务出错重试次数
    factor: 2,                                    // 重试时间间隔指数上涨为2
    minTimeout: 3000,                             // 最小重试时间间隔
    maxTimeout: 10000,                            // 最大重试时间间隔
  },
}