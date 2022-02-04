const axios = require('axios')

let accessToken = null

if (process.env.SIERRA_KEY) credsKey = process.env.SIERRA_KEY
if (process.env.SIERRA_SECRET) credsSecret = process.env.SIERRA_SECRET
if (process.env.SIERRA_BASE) credsBase = process.env.SIERRA_BASE

async function authenticate(retryCount = 1) {
  if (!credsKey || !credsSecret || !credsBase) {
    console.error('No credentails set')
  }
  try {
    const response = await axios.post(credsBase + 'token', {
      'auth': {
        'user': credsKey,
        'pass': credsSecret
      }
    })
    accessToken = response
  } catch (error) {
    if (error.response.data === {}) {
      retryAuth(retryCount)
    }
    console.error(error)
  }
}

//Retry failed authentication requests with exponential backoff up to three times
function retryAuth(retryCount) {
  if (retryCount <= 3) {
    console.log(`Authentication retry #${retryCount} due to empty response from Sierra API`)
    setTimeout(()=>authenticate(retryCount + 1),1000*retryCount*retryCount)
  }
  console.log('Authentication failed 3 times with empty responses')
}

async function reauthenticate() {
  accessToken = null
  await authenticate()
}

async function get(path) {
  await authenticate()

  // Do get call, passing `accessToken` through headers
}