'use strict'
var fs = require('fs')
var request = require('request')
var _ = require('highland')

var exports = module.exports = {}
// the API creds
exports.credsKey = null
exports.credsSecret = null
exports.credsBase = null
// are we authorized against the API?
exports.authorizedTimestamp = false
exports.authorizedToken = null
exports.authorizedTimer = null

// see if creds are in the env
if (process.env.SIERRA_KEY) exports.credsKey = process.env.SIERRA_KEY
if (process.env.SIERRA_SECRET) exports.credsSecret = process.env.SIERRA_SECRET
if (process.env.SIERRA_BASE) exports.credsBase = process.env.SIERRA_BASE

/**
* Loads a congig object, passed or from disk
*
* @param  {object|string} configOrFile - The object with the credentials or a path to a json file with the credentials
* @return {boolean} did it load or not
*/
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

      contents.base += contents.base.endsWith('/') ? '' : '/'

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
/**
* Requests an auth token from the sierra API and stores it for future use, it also setups a time to renew the token
*
* @param  {function} cb - callback
*/
exports.auth = (cb) => {
  if (!exports.credsKey || !exports.credsSecret || !exports.credsBase) {
    console.error('No credentails set')
    if (cb) cb('No credentails set', false)
  } else {
    // uses the basic auth method to ask for the token
    request.post(exports.credsBase + 'token', {
      'auth': {
        'user': exports.credsKey,
        'pass': exports.credsSecret
      }
    },
      (error, response, body) => {
        if (error) console.error(error)
        if (!response) {
          console.error('Error: Make sure you set the correct base path to the API.')
          exports.authorizedTimestamp = false
          if (cb) cb('Error: Make sure you set the correct base path to the API.', false)
        }

        if (response.statusCode === 200) {
          exports.authorizedToken = JSON.parse(body)['access_token']
          exports.authorizedTimestamp = Math.floor(Date.now() / 1000)

          // if that worked we want to keep the token always up to date, so request a new one every halflife
          // clearInterval(exports.authorizedTimer)
          // exports.authorizedTimer = setInterval(() => {
          //   exports.auth(() => {
          //     // do something on the refresh?
          //   })
          // }, ((JSON.parse(body)['expires_in'] / 2) * 1000))

          if (cb) cb(null, JSON.parse(body)['access_token'])
        } else {
          console.error('error: ' + response.statusCode)
          exports.authorizedTimestamp = false
          if (cb) cb(body, false)
        }
      })
  }
}
/**
* Requests a single bib data from the API
*
* Return format:
* { data: { total: 1, entries: [ [Object] ] },
*  url: 'https://nypl-sierra-test.iii.com/iii/sierra-api/v3/bibs/17292415?fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations' }
*
* @param  {string} bibId - the bnumber of the bib you want to request
* @param  {function} cb - callback
*/
exports.requestSingleBib = (bibId, cb) => {
  if (!exports.authorizedToken) {
    console.error('No authorizedToken set')
    if (cb) cb('No authorizedToken set', false)
  } else {
    var url = `${exports.credsBase}bibs/${bibId}?fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations`
    // use the bearer auth token
    request.get(url, {
      'timeout': 120 * 1000,
      'auth': {
        'bearer': exports.authorizedToken
      }
    },
      (error, response, body) => {
        if (error) console.error(error)
        if (response.statusCode && response.statusCode === 200) {
          if (cb) cb(null, {data: JSON.parse(body), url: url})
        } else {
          if (cb) cb(body, false)
        }
      })
  }
}
/**
* Requests a bib range from the API
*
* Return format:
* { data: { total: 1, entries: [ [Object] ] },
*  url: 'https://nypl-sierra-test.iii.com/iii/sierra-api/v3/bibs/?limit=1&id=17292415&fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations' }
*
* @param  {string} bibIdStart - the bnumber of the bib you want to request
* @param  {string} bibIdEnd - the bnumber of the bib you want to request
* @param  {function} cb - callback
*/
exports.requestRangeBib = (bibIdStart, bibIdEnd, cb) => {
  if (!exports.authorizedToken) {
    console.error('No authorizedToken set')
    if (cb) cb('No authorizedToken set', false)
  } else {
    var limit = ''
    if (bibIdEnd === '') limit = '&limit=50'
    var url = `${exports.credsBase}bibs/?id=[${bibIdStart},${bibIdEnd}]${limit}&fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations`
    console.log(url)
    // use the bearer auth token
    request.get(url, {
      'timeout': 120 * 1000,
      'auth': {
        'bearer': exports.authorizedToken
      }
    },
      (error, response, body) => {
        if (error) console.error(error)
        if (!response) {
          if (cb) cb(error, false)
          return false
        }
        if (response.statusCode && response.statusCode === 200) {
          if (cb) cb(null, {data: JSON.parse(body), url: url})
        } else {
          if (cb) cb(body, false)
        }
      })
  }
}

/**
* Requests an item range from the API
*
* Return format:
* { data: { total: 1, entries: [ [Object] ] },
*  url: 'https://nypl-sierra-test.iii.com/iii/sierra-api/v3/items/?limit=1&id=17292415&fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations' }
*
* @param  {string} itemIdStart - the bnumber of the bib you want to request
* @param  {string} itemIdEnd - the bnumber of the bib you want to request
* @param  {function} cb - callback
*/
exports.requestRangeItem = (itemIdStart, itemIdEnd, cb) => {
  if (!exports.authorizedToken) {
    console.error('No authorizedToken set')
    if (cb) cb('No authorizedToken set', false)
  } else {
    var limit = ''
    if (itemIdEnd === '') limit = '&limit=50'
    var url = `${exports.credsBase}items/?id=[${itemIdStart},${itemIdEnd}]${limit}&fields=default,fixedFields,varFields`
    console.log(url)
    // use the bearer auth token
    request.get(url, {
      'timeout': 120 * 1000,
      'auth': {
        'bearer': exports.authorizedToken
      }
    },
      (error, response, body) => {
        if (error) console.error(error)
        if (!response) {
          if (cb) cb(error, false)
          return false
        }
        if (response.statusCode && response.statusCode === 200) {
          if (cb) cb(null, {data: JSON.parse(body), url: url})
        } else {
          if (cb) cb(body, false)
        }
      })
  }
}

/**
* Requests all the items of a specified bib id
* Return format:
* { data: { total: 2, entries: [ [Object], [Object] ] },
*   url: [ 'https://catalog.library.org/iii/sierra-api/v3/items/?bibIds=17292415&fields=default,fixedFields,varFields&offset=0' ] }
*
* @param  {string} bibId - the bnumber of the bib you want to request
* @param  {function} cb - callback
*/
exports.requestBibItems = (bibId, cb) => {
  if (!exports.authorizedToken) {
    console.error('No authorizedToken set')
    if (cb) cb('No authorizedToken set', false)
  } else {
    var urls = []
    var urlsUsed = []
    var results = []
    var foundAllItems = false

    // make an array of the urls we are going to request
    for (var x = 0; x < 101; x++) {
      urls.push(`${exports.credsBase}items/?bibIds=${bibId}&fields=default,fixedFields,varFields&offset=${x * 50}`)
    }

    // this is the request function we will curry below
    var requestItems = function (url, requestItemsCb) {
      // use the bearer auth token
      request.get(url, {
        'auth': {
          'bearer': exports.authorizedToken
        }
      },
        (error, response, body) => {
          if (error) console.error(error)
          if (response.statusCode && response.statusCode === 200) {
            if (requestItemsCb) requestItemsCb(null, JSON.parse(body))
          } else {
            if (requestItemsCb) requestItemsCb(null, false)
          }
        })
    }

    // loop through each url and try it, keep going if there are still more pages to load
    _(urls)
      .map((url) => {
        if (foundAllItems) {
          url = ''
        } else {
          urlsUsed.push(url)
        }
        return url
      })
      .compact()
      .map(_.curry(requestItems))
      .nfcall([])
      .series()
      .map((result) => {
        if (result.entries) {
          result.entries.forEach((e) => {
            results.push(e)
          })
          if (result.entries.length < 50) {
            foundAllItems = true
          }
        }
      })
      .done(() => {
        cb(null, {data: {total: results.length, entries: results}, url: urlsUsed})
      })
  }
}


/**
* Requests multiple bibs, but no orders or locations
*
* Return format:
* { data: { total: 1, entries: [ [Object] ] },
*  url: 'https://ilsstaff.nypl.org/iii/sierra-api/v3/bibs/?id=14628261,14628262,14628263,14628264,14628265,14628266,14628267,14628268,14628269,14628270&fields=default,fixedFields,varFields,normTitle,normAuthor' }
*
* @param  {array} bibsIds - an array of bib id strings
* @param  {function} cb - callback
*/
exports.requestMultiBibBasic = (bibsIds, cb) => {
  if (!exports.authorizedToken) {
    console.error('No authorizedToken set')
    if (cb) cb('No authorizedToken set', false)
  } else {
    var url = `${exports.credsBase}bibs/?id=${bibsIds.join(',')}&fields=default,fixedFields,varFields,normTitle,normAuthor`
    console.log(url)
    // use the bearer auth token
    request.get(url, {
      'timeout': 120 * 1000,
      'auth': {
        'bearer': exports.authorizedToken
      }
    },
      (error, response, body) => {
        if (error) console.error(error)
        if (!response) {
          if (cb) cb(error, false)
          return false
        }
        if (response.statusCode && response.statusCode === 200) {
          if (cb) cb(null, {data: JSON.parse(body), url: url})
        } else {
          if (cb) cb(body, false)
        }
      })
  }
}

/**
* Requests multiple items
*
* Return format:
* { data: { total: 1, entries: [ [Object] ] },
*  url: 'https://ilsstaff.nypl.org/iii/sierra-api/v3/items/?id=10000000,10000100,10000200,10000300,10000400,10000500,10000600,10000700,10000800,10000900,10001000&fields=default,fixedFields,varFields' }
*
* @param  {array} itemIds - array of item ids
* @param  {function} cb - callback
*/
exports.requestMultiItemBasic = (itemIds, cb) => {
  if (!exports.authorizedToken) {
    console.error('No authorizedToken set')
    if (cb) cb('No authorizedToken set', false)
  } else {
    var url = `${exports.credsBase}items/?id=${itemIds.join(',')}&fields=default,fixedFields,varFields`
    console.log(url)
    // use the bearer auth token
    request.get(url, {
      'timeout': 120 * 1000,
      'auth': {
        'bearer': exports.authorizedToken
      }
    },
      (error, response, body) => {
        if (error) console.error(error)
        if (!response) {
          if (cb) cb(error, false)
          return false
        }
        if (response.statusCode && response.statusCode === 200) {
          if (cb) cb(null, {data: JSON.parse(body), url: url})
        } else {
          if (cb) cb(body, false)
        }
      })
  }
}
