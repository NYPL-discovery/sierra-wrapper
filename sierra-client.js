const axios = require('axios')
const fs = require('fs')
const logger = require('./logger')

const RETRY_ERROR = 'retry error'

class RetryError extends Error {
  constructor(type) {
    super(type);
    this.name = RETRY_ERROR;
    this.message = `${type} failed after 3 attempts with empty responses`
  }
}
const delay = async (time) => new Promise((resolve, reject) => setTimeout(resolve, time))


let accessToken = null
let credsKey = null
let credsSecret = null
let credsBase = null

if (process.env.SIERRA_KEY) credsKey = process.env.SIERRA_KEY
if (process.env.SIERRA_SECRET) credsSecret = process.env.SIERRA_SECRET
if (process.env.SIERRA_BASE) credsBase = process.env.SIERRA_BASE

/**
* Loads a config object, passed or from disk
*
* @param  {object|string} configOrFile - The object with the credentials or a path to a json file with the credentials
* @return {boolean} did it load or not
*/
function config(options) {
  if (typeof options === 'string') {
    // assume it is a file name
    try {
      let fileName = options
      let contents = fs.readFile(fileName, 'utf8')
      options = JSON.parse(contents)
    } catch (error) {
      console.error(`Could not open config file: ${fileName}`)
      console.error(error)
    }
  }
  credsKey = options.credsKey
  credsSecret = options.credsSecret
  credsBase = options.credsBase
  credsBase += credsBase.endsWith('/') ? '' : '/'

  if (credsKey && credsSecret && credsBase) {
    return true
  } else {
    console.error('config options not structured as expected')
    return false
  }
}

async function authenticate(_retryCount = 1) {
  if (!credsKey || !credsSecret || !credsBase) {
    throw new Error('No credentials set')
  } else if (accessToken === null) {
      const response = await axios.post(`${credsBase}token`, {
        'auth': {
          'user': credsKey,
          'pass': credsSecret
        }
      })
      if (response.data === "" && response.status < 300 && response.status >= 200) {
        await _retryAuth(_retryCount)
      } else {
        accessToken = response.data['access_token']
      }
  }
}

//Retry failed requests with exponential backoff up to three times
async function _retryAuth(_retryCount) {
  if (_retryCount <= 3) {
    logger.warning(`Authentication retry #${_retryCount} due to empty response from Sierra API`)
    await delay(1000 * Math.pow(2, _retryCount - 1))
    await authenticate(_retryCount + 1)
  } else {
    const error = new RetryError('Authentication')
    logger.error(error.message)
    throw error
  }
}

async function _retryGet(path, _retryCount){
  if (_retryCount <= 3) {
    logger.warning(`Get request retry #${_retryCount} due to empty response from Sierra API`)
    await delay(1000 * Math.pow(2, _retryCount - 1))
    await get(path, _retryCount + 1)
  } else {
    const error = new RetryError('Get request')
    logger.error(error.message)
    throw error
  }
}

async function _reauthenticate() {
  accessToken = null
  try {
    await authenticate()
  } catch (error) {
    throw error
  }
}

async function get(path, _retryCount = 1) {
  try {
    await authenticate()
    const response = await axios.get(credsBase + path, {
      'timeout': 120 * 1000, 'auth': { 'bearer': accessToken }
    })
    if (response.data === "" && response.status < 300 && response.status >= 200) {
      await _retryGet(path, _retryCount)
    } else {
      return response.data
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        await _reauthenticate()
        return get(path)
      }
    }
    else throw error
  }
}

module.exports = {
  get, authenticate, config,
  //private exports are exported for testing purposes
  _reauthenticate, _accessToken: () => accessToken, RetryError
}