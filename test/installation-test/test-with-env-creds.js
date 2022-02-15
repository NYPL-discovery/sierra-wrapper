/**
 *  Usage:
 *
 *  Assumes you have a .env with the following exported vars:
 *   SIERRA_KEY=...
 *   SIERRA_SECRET=...
 *   SIERRA_BASE=https://.../v6/
 *
 *  source .env; node ./test-with-env-creds
 */
const wrapper = require('@nypl/sierra-wrapper')

// It would be nice to be able to set logLevel as follows:
wrapper.config({ logLevel: 'debug' })

const run = async () => {
  const bibs = await wrapper.get('bibs')
  console.log('Got bibs:', bibs)
}

run()
