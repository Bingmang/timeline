const jcom = require('jd-common')
const child_process = require('child_process')
const CURL_URL =
'"http://jenkins.jd.com/job/send_wechat_alarm/buildWithParameters?token=123456"'
const ALARM_PEOPLE = ['gaomingfei']

function wxAlarm(wx_tag, alarm_info) {
  let exec_command =
    `curl ${CURL_URL} -d "WX_TAG=${wx_tag}&ALARM_INFO=${alarm_info}"`
  child_process.exec(exec_command, (err, stdout, stderr) => {
    if (err) {
      jcom.log.error('[-][TIMELINE] WxAlarm Failed!')
      jcom.log.error(err)
    }
    jcom.log('[!] Send wxAlarm:', wx_tag, alarm_info)
  })
}

function sendAlarm(alarm_info) {
  jcom._.forEach(ALARM_PEOPLE, (wx_tag) => {
    wxAlarm(wx_tag, alarm_info)
  })
}

module.exports = sendAlarm