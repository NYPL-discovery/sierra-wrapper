const axios = require('axios')
const fs = require('fs')
const logger = require('./logger')
const setLogLevel = logger.setLevel
const qs = require('qs')

const RETRY_ERROR = 'retry error'

class RetryError extends Error {
  constructor (type) {
    super(type)
    this.name = RETRY_ERROR
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

function config (options) {
  if (typeof options === 'string') {
    // assume it is a file name
    const fileName = options
    try {
      const contents = fs.readFileSync(fileName, 'utf8')
      options = JSON.parse(contents)
    } catch (error) {
      logger.error(console.error(`Could not open config file: ${fileName}`))
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

async function authenticate (_retryCount = 1) {
  if (!credsKey || !credsSecret || !credsBase) {
    throw new Error('No credentials set. Check your env variables.')
  } else if (accessToken === null) {
    const data = {
      grant_type: 'client_credentials'
    }

    const auth = {
      username: credsKey,
      password: credsSecret
    }

    const options = {
      method: 'post',
      data: qs.stringify(data),
      auth,
      url: credsBase + 'token'
    }

    const response = await axios(options)
    if (response.data === '' && response.status < 300 && response.status >= 200) {
      await _retryAuth(_retryCount)
    } else {
      accessToken = response.data.access_token
      if (accessToken === null) {
        throw new Error('Authentication error. Check your credsBase and credentials')
      }
    }
  }
}

async function _retryAuth (_retryCount) {
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

async function get (path, _retryCount = 1) {
  try {
    await authenticate()
    const response = await axios.get(credsBase + path, {
      timeout: 120 * 1000, headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (response.data === '' && response.status < 300 && response.status >= 200) {
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
    } else throw error
  }
}

async function _retryGet (path, _retryCount) {
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

async function post (path, data) {
  try {
    await authenticate()
    const response = await axios.post(credsBase + path, data, {
      timeout: 120 * 1000, headers: { Authorization: `Bearer ${accessToken}` }
    })
    return response.data
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        await _reauthenticate()
        return post(path)
      }
    } else throw error
  }
}

async function _reauthenticate () {
  accessToken = null
  await authenticate()
}

async function getSingleBib (bibId) {
  const path = `bibs/${bibId}${bibId}?fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations`
  return get(path)
}

async function getRangeBib (bibIdStart, bibIdEnd) {
  let limit = ''
  if (bibIdEnd === '') limit = '&limit=50'
  const path = `bibs/?id=[${bibIdStart},${bibIdEnd}]${limit}&fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations`
  return get(path)
}

async function getRangeItem (itemIdStart, itemIdEnd) {
  let limit = ''
  if (itemIdEnd === '') limit = '&limit=50'
  const path = `items/?id=[${itemIdStart},${itemIdEnd}]${limit}&fields=default,fixedFields,varFields`
  return get(path)
}

async function getBibItems (bibId, items = [], pagination = 0) {
  const path = `items/?bibIds=${bibId}&fields=default,fixedFields,varFields&offset=${pagination * 50}`
  const response = await get(path)
  if (response.entries.length > 0) items = [...items, ...response.entries]
  if (response.entries.length === 50) return getBibItems(bibId, items, pagination + 1)
  else {
    return items
  }
}

async function getMultiBibsBasic (bibsIds) {
  const path = `bibs/?id=${bibsIds.join(',')}&fields=default,fixedFields,varFields,normTitle,normAuthor`
  return get(path)
}

async function getMultiItemsBasic (itemIds) {
  const path = `items/?id=${itemIds.join(',')}&fields=default,fixedFields,varFields`
  return get(path)
}

module.exports = {
  authenticate,
  get,
  post,
  config,
  getBibItems,
  getMultiBibsBasic,
  getMultiItemsBasic,
  getRangeBib,
  getRangeItem,
  getSingleBib,
  setLogLevel,
  // private exports are exported for testing purposes:
  _accessToken: () => accessToken,
  RetryError,
  _reauthenticate,
  _retryAuth
}
