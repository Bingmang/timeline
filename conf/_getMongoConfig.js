module.exports = function getMongoConfig(database) {
  const ENV = process.env.ENV
  if (['dev', 'ci', 'stage', 'prod'].indexOf(ENV) < 0) {
    throw new Error('unsupport ENV=' + ENV)
    return
  }
  // only dev, ci, stage, prod can get the address.
  return getMongoAddress(database, ENV)
}

function getMongoAddress(database, env) {
  if (env === 'dev') {
    return `mongodb://127.0.0.1:27017/${database}_dev`
  }
  let mongo_address = require(
    `${process.env.HOME}/.conf/mongodb_${database}_${env}_rw`).url
  return mongo_address
}
