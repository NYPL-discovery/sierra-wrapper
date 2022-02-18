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
// const wrapper = require('@nypl/sierra-wrapper')
const wrapper = require('../../index')

wrapper.config('./creds.json')

const run = async () => {
  try{
  const bibs = await wrapper.get('bibs')
  console.log('Got bibs:', bibs.entries.map(bib=>bib.id))
  }catch(e){
    console.log('error at test run',e.message)
  }
}

run()
