'use strict'
var fs = require('fs')

var exports = module.exports = {}
// the API creds
exports.credsKey = null
exports.credsSecret = null
exports.credsBase = null
// are we authorized against the API?
exports.authorized = false

exports.loadConfig = (configOrFile) => {
  if (typeof configOrFile === 'string') {
    // assume it is a file name
    try {
      var contents = fs.readFileSync(configOrFile, 'utf8')
      contents = JSON.parse(contents)
    } catch (e) {
      console.error(`Could not open '${configOrFile}'`)
      console.error(e)
      return false
    }

    if (contents.key && contents.secret && contents.base) {
      exports.credsKey = contents.key
      exports.credsSecret = contents.secret
      exports.credsBase = contents.base
      return true
    } else {
      console.error('contents of config file were not structured as expected ')
      return false
    }
  } else if (typeof configOrFile === 'object') {
    if (configOrFile.key && configOrFile.secret && configOrFile.base) {
      exports.credsKey = configOrFile.key
      exports.credsSecret = configOrFile.secret
      exports.credsBase = configOrFile.base
      return true
    } else {
      console.error('configOrFile was not structured as expected ')
      return false
    }
  } else {
    return false
  }
}


