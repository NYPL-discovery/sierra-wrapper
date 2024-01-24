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
  let mockAxios
  beforeEach(function () {
    wrapper = rewire('../index.js')
    mockAxios = new MockAdapter(axios)
    wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
  })
  describe('authenticate', function () {
    it('should throw an error if there are no credentials', async function () {
      const wrapper = requireUncached('../index.js')
      await expect(wrapper.authenticate()).to.be.rejectedWith('No credentials set')
    })

    it('should make an axios post request with the credentials', async function () {
      mockAxios.onPost(credsBase + 'token')
        .reply(200, { access_token: '12345' })

      await wrapper.authenticate()
      expect(wrapper._accessToken()).to.equal('12345')
    })
    it('retries authentication 1x when given an empty response once', async () => {
      mockAxios.onPost(credsBase + 'token')
        .replyOnce(200, '')
        .onPost(credsBase + 'token')
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
      mockAxios.onPost(credsBase + 'token')
        .replyOnce(200, '')
        .onPost(credsBase + 'token')
        .replyOnce(200, { access_token: '12345' })
      await wrapper.authenticate()

      sinon.assert.calledOnce(loggerWarning)

      logger.warning.restore()
    })
    it('Throws a RetryError when auth fails 3 times', async () => {
      mockAxios.onPost(credsBase + 'token')
        .reply(200, '')
      const errorMessage = 'Authentication failed after 3 attempts with empty responses'

      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, errorMessage
      )
    })
    it('Logs a RetryError when auth fails 3 times', async () => {
      const loggerError = sinon.spy(logger, 'error')
      mockAxios.onPost(credsBase + 'token')
        .reply(200, '')
      const errorMessage = 'Authentication failed after 3 attempts with empty responses'

      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, errorMessage
      )

      expect(loggerError.calledWith(errorMessage))

      logger.error.restore()
    })
  })

  describe('generic get', () => {
    beforeEach(() => {
      mockAxios.onPost(credsBase + 'token')
        .reply(200, { access_token: '12345' })
    })
    const response = 'all of the books'
    it('returns data', async () => {
      mockAxios.onGet(credsBase + 'spaghetti')
        .reply(200, response)
      expect(await wrapper.get('spaghetti')).to.equal(response)
    })

    it('retries get request 1x when given an empty response once', async () => {
      const getCalls = mockAxios.onGet(credsBase + 'books')
        .replyOnce(200, '')
        .onGet(credsBase + 'books')
        .replyOnce(200, response)

      await wrapper.get('books')

      expect(getCalls.history.get.length).to.equal(2)
    })

    it('Throws a retry error when request is empty 3x', async () => {
      mockAxios.onGet(credsBase + 'books')
        .reply(200, '')
      const errorMessage = 'Get request failed after 3 attempts with empty responses'
      await expect(wrapper.get('books')).to.be.rejectedWith(wrapper.RetryError,
        errorMessage)
    })

    it('Logs a retry error when request is empty 3x', async () => {
      const loggerError = sinon.spy(logger, 'error')
      mockAxios.onGet(credsBase + 'books')
        .reply(200, '')
      const errorMessage = 'Get request failed after 3 attempts with empty responses'
      await expect(wrapper.get('books')).to.be.rejectedWith(wrapper.RetryError,
        errorMessage)
      expect(loggerError.calledWith(errorMessage))
      logger.error.restore()
    })
  })

  describe('reauthentication for expired access token', () => {
    let handleAuthErrorSpy
    const path = 'path'
    const data = 'the books'
    beforeEach(() => {
      const _handleAuthError = wrapper.__get__('_handleAuthError')
      handleAuthErrorSpy = sinon.spy(_handleAuthError)
      wrapper.__set__('_handleAuthError', handleAuthErrorSpy)
      // mock successful auth call
      mockAxios.onPost(`${credsBase}token`)
        .reply(200, { access_token: '12345' })
      // mock response to first tested request with expired token
      mockAxios.onAny(credsBase + 'newBooks').replyOnce(401)
        // mock retry with a success
        .onAny(credsBase + 'newBooks').reply(200, 'success')
    })
    after(() => { wrapper = requireUncached('../index.js') })
    it('post', async () => {
      await wrapper.post('newBooks', data)

      expect(handleAuthErrorSpy.calledWith(wrapper.post, path, data))
    })
    it('put', async () => {
      await wrapper.put('newBooks', data)
      expect(handleAuthErrorSpy.calledWith(wrapper.put, path, data))
    })
    it('delete', async () => {
      await wrapper.deleteRequest('newBooks')
      expect(handleAuthErrorSpy.calledWith(wrapper.deleteRequest, path, data))
    })
    it('get', async () => {
      await wrapper.get('newBooks')
      expect(handleAuthErrorSpy.calledWith(wrapper.get, path, data))
    })
  })

  describe('getBibItems', () => {
    it('should recursively return all items from a given bib', async () => {
      const authStub = () => true
      wrapper.__set__('authenticate', authStub)
      mockAxios
        .onAny(credsBase + 'items/?bibIds=bibId&fields=default,fixedFields,varFields&offset=0').reply(200, { entries: Array(50).fill('item') })
        .onAny(credsBase + 'items/?bibIds=bibId&fields=default,fixedFields,varFields&offset=50').reply(200, { entries: Array(50).fill('item') })
        .onAny(credsBase + 'items/?bibIds=bibId&fields=default,fixedFields,varFields&offset=100').reply(200, { entries: Array(15).fill('item') })

      const items = await wrapper.getBibItems('bibId')
      expect(items.length).to.equal(115)
    })
  })
  describe('makes a request with the rights headers, method, path, and data', () => {
    let axiosCalls
    const data = { title: 'spaghetti' }
    beforeEach(() => {
      axiosCalls = mockAxios
        .onPost(credsBase + 'token').reply(200, { access_token: '12345' })
        .onAny(credsBase + 'path').reply(200, 'success')
    })
    it('put', async () => {
      await wrapper.put('path', data)

      const putCalls = axiosCalls.history.put
      expect(putCalls.length).to.equal(1)
      expect(putCalls[0].headers.Authorization).to.equal('Bearer 12345')
      expect(putCalls[0].method).to.equal('put')
      expect(putCalls[0].url).to.equal(credsBase + 'path')
      expect(JSON.parse(putCalls[0].data)).to.deep.equal(data)
    })
    it('post', async () => {
      await wrapper.post('path', data)

      const postCalls = axiosCalls.history.post
      // 2 calls because the first one is auth post
      expect(postCalls.length).to.equal(2)
      expect(postCalls[1].headers.Authorization).to.equal('Bearer 12345')
      expect(postCalls[1].method).to.equal('post')
      expect(postCalls[1].url).to.equal(credsBase + 'path')
      expect(JSON.parse(postCalls[1].data)).to.deep.equal(data)
    })
    it('delete', async () => {
      await wrapper.deleteRequest('path')

      const deleteCalls = axiosCalls.history.delete
      expect(deleteCalls.length).to.equal(1)
      expect(deleteCalls[0].headers.Authorization).to.equal('Bearer 12345')
      expect(deleteCalls[0].method).to.equal('delete')
      expect(deleteCalls[0].url).to.equal(credsBase + 'path')
    })
    it('get', async () => {
      await wrapper.get('path')

      const getCalls = axiosCalls.history.get
      expect(getCalls.length).to.equal(1)
      expect(getCalls[0].headers.Authorization).to.equal('Bearer 12345')
      expect(getCalls[0].method).to.equal('get')
      expect(getCalls[0].url).to.equal(credsBase + 'path')
    })
  })
})
