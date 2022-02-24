/* global describe, it */
function requireUncached (module) {
  delete require.cache[require.resolve(module)]
  return require(module)
}
let wrapper
const MockAdapter = require('axios-mock-adapter')
const axios = require('axios')
const chai = require('chai')
const { expect } = chai
chai.use(require('chai-as-promised'))
const sinon = require('sinon')
const logger = require('../logger')
const rewire = require('rewire')

const credsBase = 'credsBase.com/'
const credsKey = 'credsKey'
const credsSecret = 'credsSecret'

describe('test', function () {
  let auth
  let mockAxios

  beforeEach(function () {
    mockAxios = new MockAdapter(axios)
    wrapper = requireUncached('../index.js')
    wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
    auth = {
      auth:
      {
        user: credsKey,
        pass: credsSecret
      }
    }
  })

  describe('authenticate', function () {
    it('should throw an error if there are no credentials', async function () {
      wrapper = requireUncached('../index.js')
      await expect(wrapper.authenticate()).to.be.rejectedWith('No credentials set')
    })
    it('should make an axios post request with the credentials', async function () {
      mockAxios.onPost()
        .reply(200, { access_token: '12345' })

      await wrapper.authenticate()
      expect(wrapper._accessToken()).to.equal('12345')
    })
    it('retries authentication 1x when given an empty response once', async () => {
      mockAxios.onPost()
        .replyOnce(200, '')
        .onPost()
        .replyOnce(200, { access_token: '12345' })
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      const retryAuth = wrapper.__get__('_retryAuth')
      const retrySpy = sinon.spy(retryAuth)
      wrapper.__set__('_retryAuth', retrySpy)
      await wrapper.authenticate()

      sinon.assert.calledOnce(retrySpy)
    })
    it('logs a warning when there is an empty response', async () => {
      const loggerWarning = sinon.spy(logger, 'warning')
      mockAxios.onPost()
        .replyOnce(200, '')
        .onPost()
        .replyOnce(200, { access_token: '12345' })
      await wrapper.authenticate()

      sinon.assert.calledOnce(loggerWarning)

      logger.warning.restore()
    })
    it('Throws a RetryError when auth fails 3 times', async () => {
      mockAxios.onPost()
        .reply(200, '')
      const errorMessage = 'Authentication failed after 3 attempts with empty responses'
      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, errorMessage
      )
    })
    it('Logs a RetryError when auth fails 3 times', async () => {
      const loggerError = sinon.spy(logger, 'error')
      mockAxios.onPost()
        .reply(200, '')
      const errorMessage = 'Authentication failed after 3 attempts with empty responses'
      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, errorMessage
      )
      expect(loggerError.calledWith(errorMessage))
      logger.error.restore()
    })
  })

  describe('generic get', () => {
    const response = 'all of the books'
    it('returns data', async () => {
      mockAxios.onPost()
        .reply(200, { access_token: '12345' })
      mockAxios.onGet()
        .reply(200, response)

      expect(await wrapper.get()).to.equal(response)
    })

    it('calls reauthenticate when the access token is expired', async () => {
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      const reauthenticate = wrapper.__get__('_reauthenticate')
      const reauthenticateSpy = sinon.spy(reauthenticate)
      wrapper.__set__('_reauthenticate', reauthenticateSpy)
      mockAxios.onGet()
        .replyOnce(401).onGet().reply(200, response)
      mockAxios.onPost()
        .reply(200, { access_token: '12345' })
      await wrapper.get('books')

      expect(reauthenticateSpy.called)

      wrapper = requireUncached('../index.js')
    })

    it('retries get request 1x when given an empty response once', async () => {
      const axiosSpy = sinon.spy(axios, 'get')
      sinon.spy(wrapper, 'authenticate')
      mockAxios.onGet()
        .replyOnce(200, '')
        .onGet()
        .replyOnce(200, response)
      mockAxios.onPost().reply(200, { access_token: '12345' })

      await wrapper.get('books')
      sinon.assert.calledTwice(axiosSpy)

      axios.get.restore()
    })

    it('Throws a retry error when request is empty 3x', async () => {
      mockAxios.onPost().reply(200, { access_token: '12345' })
      mockAxios.onGet()
        .reply(200, '')
      const errorMessage = 'Get request failed after 3 attempts with empty responses'
      await expect(wrapper.get()).to.be.rejectedWith(wrapper.RetryError,
        errorMessage)
    })

    it('Logs a retry error when request is empty 3x', async () => {
      const loggerError = sinon.spy(logger, 'error')
      mockAxios.onPost().reply(200, { access_token: '12345' })
      mockAxios.onGet()
        .reply(200, '')
      const errorMessage = 'Get request failed after 3 attempts with empty responses'
      await expect(wrapper.get()).to.be.rejectedWith(wrapper.RetryError,
        errorMessage)
      expect(loggerError.calledWith(errorMessage))
      logger.error.restore()
    })
  })

  describe('generic post', async () => {
    it('calls reauthenticate when the access token is expired', async () => {
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      const reauthenticate = wrapper.__get__('_reauthenticate')
      const reauthenticateSpy = sinon.spy(reauthenticate)
      wrapper.__set__('_reauthenticate', reauthenticateSpy)
      const data = { books: ['the', 'books'] }
      // authenticate
      mockAxios.onPost(`${credsBase}token`, auth)
        .reply(200, { access_token: '12345' })
        // post() call
      mockAxios.onPost()
        .replyOnce(401).onPost().reply(200, 'success')
      await wrapper.post('newBooks', data)
      expect(reauthenticateSpy.called)
    })
  })

  describe('getBibItems', () => {
    it('should recursively return all items from a given bib', async () => {
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      const authStub = () => true
      wrapper.__set__('authenticate', authStub)

      const axiosGet = sinon.stub(axios, 'get')
      const fiftyItems = { data: { entries: Array(50).fill('item') } }
      const fifteenItems = { data: { entries: Array(15).fill('item') } }
      axiosGet.onFirstCall().returns(fiftyItems)
      axiosGet.onSecondCall().returns(fiftyItems)
      axiosGet.onThirdCall().returns(fifteenItems)

      const items = await wrapper.getBibItems('bibId')
      expect(items.length).to.equal(115)
    })
  })
})
