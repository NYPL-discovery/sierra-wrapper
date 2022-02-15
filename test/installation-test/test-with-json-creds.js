/**
 *  Usage:
 *
 *  Assumes you have a creds.json with the following keys:
 *    "key": "...",
 *    "secret": "...",
 *    "base": "https://.../v6/"
 *
 *  source .env; node ./test-with-env-creds
 */
const wrapper = require('@nypl/sierra-wrapper')

wrapper.config('./creds.json')

const run = async () => {
  const bibs = await wrapper.get('bibs')
  console.log('Got bibs:', bibs)
}

run()
