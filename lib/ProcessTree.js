const $ = require('../$')

/**
 * 建立进程树，功能是可以在任务的所有子进程下进行广播
 */
class ProcessTree {
  constructor(pid) {
    this.pid = $._.parseInt(pid)
    this.process_tree = null
    this.process_list = null
  }

  /**
   * 等待一段时间后，查询进程树中任然存在的进程
   * @param {Integer} delay 
   * @returns {String[]}
   */
  checkAlive(delay = 0) {
    if (!this.process_tree) {
      return
    }
    return new $.Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          let alive_pids = await _checkPidsAlive(this.process_list)
          resolve(alive_pids)
        } catch (err) {
          reject(err)
        }
      }, delay)
    })
  }

  /**
   * 为当前进程树中的每个进程发送信号
   * @param {String|Integer} signal 
   */
  async sendSignal(signal) {
    if (!this.process_tree || !this.process_list.length) {
      return
    }
    _killAll(this.process_tree, signal)
  }

  /**
   * 初始化进程树
   */
  async init() {
    this.process_tree = await _buildProcessTree(this.pid)
    this.process_list = $._.map($._.keys(this.process_tree), $._.parseInt)
  }
}

/**
 * 建立ProcessTree, 查询多次
 * @param {Integer} pid 
 * @returns {Object}
 */
function _buildProcessTree(pid) {
  return new $.Promise((resolve, reject) => {
    let tree = {}
    let pids_to_process = {}
    tree[pid] = []
    pids_to_process[pid] = 1
    _buildProcessTreeCore(pid, tree, pids_to_process, () => {
      resolve(tree)
    })
  })
}
function _buildProcessTreeCore(parent_pid, tree, pids_to_process, callback) {
  let ps = $.child_process
    .spawn('ps', ['-o', 'pid', '--no-headers', '--ppid', parent_pid])
  let all_data = ''
  ps.stdout.on('data', (data) => {
    all_data += data.toString('ascii')
  })
  let onClose = function (code) {
    delete pids_to_process[parent_pid]
    if (code != 0) {
      // no more parent processes
      if ($._.keys(pids_to_process).length == 0) {
        callback()
      }
      return
    }
    all_data.match(/\d+/g).forEach((pid) => {
      pid = $._.parseInt(pid)
      tree[parent_pid].push(pid)
      tree[pid] = []
      pids_to_process[pid] = 1
      _buildProcessTreeCore(pid, tree, pids_to_process, callback)
    })
  }
  ps.on('close', onClose)
}

/**
 * 检查pid_list中还在进程中的pid, 只查询一次
 * @param {Array} pid_list 
 * @returns {Integer[]}
 */
function _checkPidsAlive(pid_list) {
  return new $.Promise((resolve, reject) => {
    let query = $._.join(pid_list, '|')
    $.child_process
      .exec(`ps -e -o pid | grep -E '${query}'`, (err, stdout, stderr) => {
        err ? resolve([]) :
          resolve($._.compact($._.split(stdout, '\n')))
      })
  })
}

/**
 * 对进程树中的所有进程传递信号
 * @param {Object} tree 
 * @param {String|Integer} signal 
 * @returns {Promise}
 */
function _killAll(tree, signal) {
  let killed = {}
  $._.forEach($._.keys(tree), (pid) => {
    $._.forEach(tree[pid], (pidpid) => {
      if (!killed[pidpid]) {
        _killPid(pidpid, signal)
        killed[pidpid] = 1
      }
    })
    if (!killed[pid]) {
      _killPid(pid, signal)
      killed[pid] = 1
    }
  })
}
function _killPid(pid, signal) {
  try {
    process.kill($._.parseInt(pid), signal)
  } catch (err) {
    if (err.code === 'ESRCH') {
      // 找不到pid, 认为该pid已退出, 不进行操作 
    } else {
      // 找到pid, 但是发送信号失败, 抛出异常
      throw err
    }
  }
}

module.exports = ProcessTree
