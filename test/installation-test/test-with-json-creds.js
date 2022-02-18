/**
 *  Usage:
 *
 *  Assumes you have a creds.json with the following keys:
 *    "key": "...",
 *    "secret": "...",
 *    "base": "https://.../v6/"
 *
 *    node ./test-with-json-creds
 */
// const wrapper = require('@nypl/sierra-wrapper')
const wrapper = require('../../index')

wrapper.config('./creds.json')

const run = async () => {
  try{
  const bibs = await wrapper.get('bibs')
  console.log('Got bibs:', bibs.entries.map(bib=>bib.id))
  }catch(e){
    console.error('error at test run',e)
  }
}

run()
