module.exports = getDbConfig

function getDbConfig(database) {
  const ENV = process.env.ENV
  if (['dev', 'ci', 'prod'].indexOf(ENV) < 0) {
    throw new Error('unsupport ENV=' + ENV)
  }
  switch (ENV) {
    case 'prod':
      return getMongoAddress(database, 'prod')
    case 'ci':
      return getMongoAddress(database, 'ci')
    case 'dev':
      return getMongoAddress(database, 'dev')
    default:
      return ''
  }
}

function getMongoAddress(database, env) {
  // ENV=dev
  if (env === 'dev') {
    return `mongodb://127.0.0.1:27017/${database}_dev`
  }
  // ENV=ci or prod
  // require('~/.conf/important_dbp_prod_rw')
  // require('~/.conf/important_dbp_ci_rw')
  let mongo_address = require(
    `${process.env.HOME}/.conf/mongodb_${database}_${env}_rw`).url
  // 'mongodb://user:password@host:port/database_env'
  return mongo_address
}

