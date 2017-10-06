let X = module.exports
const COMMON_LIBS = [
  ['Agenda', 'agenda'],
  'assert',
  ['Promise', 'bluebird'],
  'child_process',
  ['fs', 'mz/fs'],
  'moment',
  ['_', 'lodash'],
  'path',
  ['retry', 'promise-retry'],
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