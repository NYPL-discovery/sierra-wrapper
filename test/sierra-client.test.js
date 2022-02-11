/* global describe, it */
function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}
let wrapper
const MockAdapter = require('axios-mock-adapter')
const axios = require('axios')
const chai = require('chai')
//const wrapper = require('../sierra-client.js')
const { expect } = chai
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
const logger = require('../logger')

const credsBase = 'credsBase.com/'
const credsKey = 'credsKey'
const credsSecret = 'credsSecret'

describe('test', function () {
  let auth
  let mockAxios

  beforeEach(function () {
    mockAxios = new MockAdapter(axios)
    wrapper = requireUncached('../sierra-client.js')
    wrapper.config({ credsKey, credsSecret, credsBase })
    auth = {
      'auth':
      {
        'user': "credsKey",
        'pass': "credsSecret"
      }
    }
  })

  describe('authenticate', function () {
    it('should throw an error if there are no credentials', async function () {
      wrapper = requireUncached('../sierra-client.js')
      await expect(wrapper.authenticate()).to.be.rejectedWith(`No credentials set`)
    })
    it('should make an axios post request with the credentials', async function () {
      mockAxios.onPost(`${credsBase}token`, auth)
        .reply(200, { "access_token": "12345" })

      await wrapper.authenticate()
      expect(wrapper._accessToken()).to.equal("12345")
    })
    it('retries authentication 1x when given an empty response once', async () => {
      const axiosSpy = sinon.spy(axios, 'post')
      sinon.spy(wrapper, 'authenticate')
      mockAxios.onPost(`${credsBase}token`, auth)
        .replyOnce(200, "")
        .onPost(`${credsBase}token`, auth)
        .replyOnce(200, { "access_token": "12345" })

      await wrapper.authenticate()

      sinon.assert.calledTwice(axiosSpy)
      axios.post.restore()
    })
    it('logs a warning when there is an empty response', async () => {
      loggerWarning = sinon.spy(logger, 'warning')
      mockAxios.onPost(`${credsBase}token`, auth)
        .replyOnce(200, "")
        .onPost(`${credsBase}token`, auth)
        .replyOnce(200, { "access_token": "12345" })
      await wrapper.authenticate()

      sinon.assert.calledOnce(loggerWarning)

      logger.warning.restore()
    })
    it('Throws a RetryError when auth fails 3 times', async () => {

      mockAxios.onPost(`${credsBase}token`, auth)
        .reply(200, "")
      const errorMessage = "Authentication failed after 3 attempts with empty responses"
      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, errorMessage
      )
    })
    it('Logs a RetryError when auth fails 3 times', async () => {
      let loggerError = sinon.spy(logger, 'error')
      mockAxios.onPost(`${credsBase}token`, auth)
        .reply(200, "")
      const errorMessage = "Authentication failed after 3 attempts with empty responses"
      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, errorMessage
      )
      expect(loggerError.calledWith(errorMessage))
      logger.error.restore()
    })
  })

  describe('generic get', () => {
    let response = "all of the books"
    it('returns data', async () => {
      mockAxios.onPost(`${credsBase}token`, auth)
        .reply(200, { "access_token": "12345" })
      mockAxios.onGet()
        .reply(200, response)

      expect(await wrapper.get()).to.equal(response)
    })

    it('calls reauthenticate when the access token is expired', async () => {
      const axiosSpy = sinon.spy(axios, 'get')
      mockAxios.onGet()
        .replyOnce(401).onGet().reply(200, response)
      mockAxios.onPost()
        .reply(200, { "access_token": "12345" })

      await wrapper.get("books")
      sinon.assert.calledTwice(axiosSpy)

      axios.get.restore()
    })

    it('retries get request 1x when given an empty response once', async () => {
      const axiosSpy = sinon.spy(axios, 'get')
      sinon.spy(wrapper, 'authenticate')
      mockAxios.onGet()
        .replyOnce(200, "")
        .onGet()
        .replyOnce(200, response)
      mockAxios.onPost().reply(200, { "access_token": "12345" })

      await wrapper.get("books")
      sinon.assert.calledTwice(axiosSpy)

      axios.get.restore()
    })

    it('Throws a retry error when request is empty 3x', async () => {
      mockAxios.onPost(`${credsBase}token`, auth).reply(200, { "access_token": "12345" })
      mockAxios.onGet()
        .reply(200, "")
      const errorMessage = "Get request failed after 3 attempts with empty responses"
      await expect(wrapper.get()).to.be.rejectedWith(wrapper.RetryError,
        errorMessage)
    })

    it('Logs a retry error when request is empty 3x', async () => {
      let loggerError = sinon.spy(logger, 'error')
      mockAxios.onPost(`${credsBase}token`, auth).reply(200, { "access_token": "12345" })
      mockAxios.onGet()
        .reply(200, "")
      const errorMessage = "Get request failed after 3 attempts with empty responses"
      await expect(wrapper.get()).to.be.rejectedWith(wrapper.RetryError,
        errorMessage)
      expect(loggerError.calledWith(errorMessage))
      logger.error.restore()
    })
  })

  describe('getBibItems', () => {
    it('should recursively return all items from a given bib', async () => {
      axiosGet = sinon.stub(axios, 'get')
      axiosPost = sinon.stub(axios, 'post')
      const fiftyItems = { data: { entries: Array(50).fill("item") } }
      const fifteenItems = { data: { entries: Array(15).fill("item") } }
      axiosPost.returns({ data: { 'access_token': '12345' } })
      axiosGet.onFirstCall().returns(fiftyItems)
      axiosGet.onSecondCall().returns(fiftyItems)
      axiosGet.onThirdCall().returns(fifteenItems)

      const items = await wrapper.getBibItems("bibId")
      expect(items.length).to.equal(115)
    })
  })
})


