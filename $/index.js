let X = module.exports
X.conf = require('../conf')
;({ log: X.log, fs: X.fs, alarmWechat: X.alarmWechat } = require('jd-common'))
const COMMON_LIBS = [
  ['Agenda', 'agenda'],
  'assert',
  ['Promise', 'bluebird'],
  'child_process',
  'moment',
  ['_', 'lodash'],
  'redis',
  'path',
]
COMMON_LIBS.forEach(function (x) {
  let rename, libname
  if (x.constructor === Array) {
    rename = x[0]
    libname = x[1]
  } else {
    rename = x
    libname = x
  }
  X[rename] = require(libname)
})
X.Promise.promisifyAll(X.redis)
Function.prototype.bind = (function (origBind) {
  return function () {
    let fn = origBind.apply(this, arguments)
    fn.__origFn__ = this.__origFn__ || this
    return fn
  }
}(Function.prototype.bind))
Function.prototype.unbind = function () {
  return this.__origFn__ || this
}