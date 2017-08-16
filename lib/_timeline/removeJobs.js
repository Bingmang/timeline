const $ = require('../../$')

function removeJobs(timeline, to_delete_jobs) {
  $._.map(to_delete_jobs, (job_name) => {
    let re = new RegExp(job_name + ' *')
    timeline.jobs({ name: re }, (err, jobs) => {
      $._.map(jobs, (job) => {
        job.remove((err) => {
          if (err) {
            $.log.error(`[-][TIMELINE] Remove job failed: [${job_name}]`)
          }
          $.log(`[+][TIMELINE] Remove job succesed: [${job_name}]`)
        })
      })
    })
  })
}

module.exports = removeJobs