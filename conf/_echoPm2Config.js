const app_name = 'timeline-' + process.env.ENV
let instances = process.env.ENV === 'prod' ? 16 : 2
module.exports = JSON.stringify({
  'apps': [
    {
      name: app_name,
      script: 'bin/www',
      kill_timeout: 1200000,
      log_file: `~/log/${app_name}.log`,
      error_file: `~/log/${app_name}-err.log`,
      exec_mode: 'cluster',
      instances: instances,
      treekill: false,
    },
  ],
})
