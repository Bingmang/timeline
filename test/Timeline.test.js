const $ = require('../$')
const Timeline = require('..')

describe('Timeline test', function () {
  it('jd-timeline-job-example', async () => {
    // let npm_dir = await downloadJob('jd-timeline-job-example')
    let timeline = new Timeline($._.merge($.conf.timeline, {
    }))
    timeline.start()
    await waitingForTest(timeline, 60000)
  })
})

/**
 * 下载任务
 * @param {String} package_name 
 * @returns {String}
 */
function downloadJob(package_name) {
  return new Promise((resolve, reject) => {
    let temp_folder = $.fs.mkdtempSync('./tmp-')
    if ($.fs.existsSync('./.tmp'))
      $.child_process.exec(
        'git clone git@git.jd.com:npm/' + package_name + '.git && ' +
        'cd ' + package_name + ' $$ ' +
        'npm install', {
          cwd: temp_folder,
          env: process.env,
        }, (err, stdout, stderr) => {
          if (err) {
            reject(err)
          }
          resolve(temp_folder)
        })
  })
}

/**
 * 等待指定时间后停止timeline
 * @param {Timeline} timeline 
 * @param {Integer} delay 
 */
function waitingForTest(timeline, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await timeline.stop()
        resolve()
      } catch (err) {
        reject(err)
      }
    }, delay)
  })
}