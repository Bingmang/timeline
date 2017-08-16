<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [JD-Timeline](#jd-timeline)
    - [start](#start)
    - [usage](#usage)
    - [feature](#feature)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## JD-Timeline

---

### start

---

```sh
npm install
npm start
npm stop
```

### usage

---

在自己的项目文件下添加`timeline.json`文件

```json
{
  "schedule": "*/30 * * * * *",
  "timeout": 30000
}

任务会根据package.json中的版本号来分辨任务， 所以更新`timeline.json`时请更新版本号
```

**注意：crontab和jenkins的格式不一样**

```
* * * * * *
| | | | | | 
| | | | | +-- Day of the Week   (range: 0-6, 0 standing for Monday)
| | | | +---- Month             (range: 0-11)
| | | +------ Day of the Month  (range: 1-31)
| | +-------- Hour              (range: 0-23)
| +---------- Minute            (range: 0-59)
+------------ Second            (range: 0-59)
```

### feature

- 任务失败或超时会自动重试（次数默认为3次），当失败时会发通知，通知频率和crontab一样

- 进程结束会将当前进程的任务进行转移，在其他进程上重新执行(默认在10秒内)

关于任务是如何执行的:

https://yiqixie.com/d/home/fcAAKTPdjAm8DHW4uh9v_C7o4