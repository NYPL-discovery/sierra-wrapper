const fs = require('fs')
const logger = require('./logger')
const setLogLevel = logger.setLevel
const qs = require('qs')

const RETRY_ERROR = 'retry error'
const MAX_RETRIES = 3
class RetryError extends Error {
  constructor (type) {
    super(type)
    this.name = RETRY_ERROR
    this.message = `${type} failed after ${MAX_RETRIES} attempts with empty responses`
  }
}

class HttpError extends Error {
  constructor (message, resp) {
    super(message)
    this.response = resp
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

  credsKey = options.key
  credsSecret = options.secret
  credsBase = options.base
  credsBase += credsBase && credsBase.endsWith('/') ? '' : '/'

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

    const path = credsBase + 'token'
    const creds = Buffer.from(`${credsKey}:${credsSecret}`).toString('base64')

    const options = {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        Authorization: `Basic ${creds}`
      }
    }

    let response
    try {
      response = await fetch(path, options)
      let json = await response.json()
      // check for mysterious empty 200 response from Sierra API and retry auth
      if (json === '' && response.status < 300 && response.status >= 200) {
        await _retryAuth(_retryCount)
      } else {
        accessToken = json.access_token
      }
    } catch (e) {
      // maxed out Retries
      if (e instanceof RetryError) throw e
      // other auth error - probably bad credentials
      else throw new Error('Sierra wrapper authentication error. Check your credsBase and credentials')
    }
  }
}

async function get (path, _retryCount = 1) {
  try {
    const response = await _doHttpRequest('get', path)
    if (response.data === '' && response.status < 300 && response.status >= 200) {
      return await _retryGet(path, _retryCount)
    } else {
      return response.data
    }
  } catch (error) {
    return await _handleErrors(error, get, path)
  }
}

async function post (path, data) {
  try {
    const response = await _doHttpRequest('post', path, data)
    return response.data
  } catch (error) {
    return await _handleErrors(error, post, path, data)
  }
}

async function put (path, data) {
  try {
    const response = await _doHttpRequest('put', path, data)
    return response.data
  } catch (error) {
    return await _handleErrors(error, put, path, data)
  }
}

async function deleteRequest (path) {
  try {
    const response = await _doHttpRequest('delete', path)
    return response.data
  } catch (error) {
    return await _handleErrors(error, deleteRequest, path)
  }
}

async function _retryAuth (_retryCount) {
  if (_retryCount <= MAX_RETRIES) {
    logger.warning(`Authentication retry #${_retryCount} due to empty response from Sierra API`)
    await delay(1000 * Math.pow(2, _retryCount - 1))
    await authenticate(_retryCount + 1)
  } else {
    const error = new RetryError('Authentication')
    logger.error(error.message)
    throw error
  }
}

async function _retryGet (path, _retryCount) {
  if (_retryCount <= MAX_RETRIES) {
    logger.warning(`Get request retry #${_retryCount} due to empty response from Sierra API`)
    await delay(1000 * Math.pow(2, _retryCount - 1))
    return await get(path, _retryCount + 1)
  } else {
    const error = new RetryError('Get request')
    logger.error(error.message)
    throw error
  }
}

async function _handleErrors (error, method, path, data) {
  if (error.response && error.response.status === 401) {
    return _handleAuthError(method, path, data)
  }
  throw error
}

async function _handleAuthError (method, path, data) {
  await _reauthenticate()
  return method(path, data)
}

async function _doHttpRequest (method, path, data) {
  await authenticate()
  const options = {
    method,
    signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${accessToken}` }
  }
  if (data) { options.body = JSON.stringify(data) }
  const response = await fetch(credsBase + path, options)
  const json = await response.json()
  if (response.status >= 400) {
    throw new HttpError('Http request error', response)
  }
  return { data: json, status: response.status }
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
  put,
  deleteRequest,
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
  _retryAuth,
  _doHttpRequest
}
