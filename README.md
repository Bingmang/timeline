<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [JD-Timeline](#jd-timeline)
    - [start](#start)
    - [usage](#usage)

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