// mongodb
const MONGODB_ADDRESS = 'mongodb://127.0.0.1:27017/timeline'
const MONGODB_COLLECTION = 'timelineJobs'
// npm dir
const NPM_DIR = process.env.HOME + '/npm'
// scan dir schedule
const SCAN_DIR_SCHEDULE = 10000
// default name
const NAME = 'TIMELINE - ' + process.pid // 当前进程的名字
const CONFIG_NAME = 'timeline.json'     // 配置文件的名字
// default option
const TRANSFER_DELAY = 'in 10 seconds'  // 进程结束后转移本机任务， 指定下次执行任务的时间
const MAX_CONCURRENCY = 1               // 单个timeline进程所能执行的任务数量
const LOCAL_TIMEZONE = 'Asia/Shanghai'
const DEFAULT_CONCURRENCY = 1           
const DEFAULT_LOCK_LIMIT = 0            // 当前锁定任务的最大数量， 0代表无限
const DEFAULT_LOCK_LIFETIME = 1200000   // 20 mins
const DEFAULT_DEFINE_OPTION = {         
  priority: 'normal',                   // 当前任务优先级都为normal
}
const DEFAULT_EXECUTE_OPTION = {
  retries: 2,                           // 任务出错重试次数
  factor: 2,                            // 重试时间间隔指数上涨为2
  minTimeout: 3000,                     // 最小重试时间间隔
  maxTimeout: 10000,                    // 最大重试时间间隔
}


module.exports = {
  // timeline config:
  name: NAME,
  db: {
    address: MONGODB_ADDRESS,
    collection: MONGODB_COLLECTION,
  },
  npm_dir: NPM_DIR,
  scan_dir_schedule: SCAN_DIR_SCHEDULE,
  transfer_delay: TRANSFER_DELAY,
  maxConcurrency: MAX_CONCURRENCY,
  timezone: LOCAL_TIMEZONE,
  defaultConcurrency: DEFAULT_CONCURRENCY,
  defaultLockLimit: DEFAULT_LOCK_LIMIT,
  defaultLockLifetime: DEFAULT_LOCK_LIFETIME,

  // job config: 
  config_name: CONFIG_NAME,
  default_define_option: DEFAULT_DEFINE_OPTION,
  default_execute_option: DEFAULT_EXECUTE_OPTION,
}