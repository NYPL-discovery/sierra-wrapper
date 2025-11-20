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
    wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
  })

  describe('authenticate', function () {
    it('should throw an error if there are no credentials', async function () {
      const wrapper = requireUncached('../index.js')
      await expect(wrapper.authenticate()).to.be.rejectedWith('No credentials set')
    })

    it('should make an axios post request with the credentials', async function () {

      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        }
      })

      await wrapper.authenticate()
      expect(wrapper._accessToken()).to.equal('12345')
    })

    it('retries authentication 1x when given an empty response once', async () => {
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      const retryAuth = wrapper.__get__('_retryAuth')
      const retrySpy = sinon.spy(retryAuth)
      wrapper.__set__('_retryAuth', retrySpy)
      let tries = 0
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && tries !== 0 && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        } else {
          tries += 1
          return { status: 200, json: () => '' }
        }
      })

      await wrapper.authenticate()

      sinon.assert.calledOnce(retrySpy)
    })

    it('logs a warning when there is an empty response', async () => {
      const loggerWarning = sinon.spy(logger, 'warning')
      let tries = 0
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && tries !== 0 && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        } else {
          tries += 1
          return { status: 200, json: () => '' }
        }
      })
      await wrapper.authenticate()

      sinon.assert.calledOnce(loggerWarning)

      logger.warning.restore()
    })

    it('Throws a RetryError when auth fails 3 times', async () => {
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        return { status: 200, json: () => '' }
      })
      const errorMessage = 'Authentication failed after 3 attempts with empty responses'

      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, errorMessage
      )
    })

    it('Logs a RetryError when auth fails 3 times', async () => {
      const loggerError = sinon.spy(logger, 'error')
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        return { status: 200, json: () => '' }
      })
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
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        }
        if (path === credsBase + 'spaghetti') {
          return { status: 200, json: () => { return response } }
        }
      })
      expect(await wrapper.get('spaghetti')).to.equal(response)
    })

    it('retries get request 1x when given an empty response once', async () => {
      let tries = 0

      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        }
        if (path === credsBase + 'books' && tries > 0) {
          return { status: 200, json: () => { return response } }
        } else {
          tries += 1
          return { status: 200, json: () => '' }
        }
      })

      const resp = await wrapper.get('books')

      expect(tries).to.equal(1)
      expect(resp).to.equal(response)
    })

    it('Throws a retry error when request is empty 3x', async () => {
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        } else {
          return { status: 200, json: () => '' }
        }
      })
      const errorMessage = 'Get request failed after 3 attempts with empty responses'
      await expect(wrapper.get('books')).to.be.rejectedWith(wrapper.RetryError,
        errorMessage)
    })

    it('Logs a retry error when request is empty 3x', async () => {
      const loggerError = sinon.spy(logger, 'error')
      wrapper = rewire('../index.js')
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        } else {
          return { status: 200, json: () => '' }
        }
      })
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
    const data = { books: 'the books' }
    let tries = 0
    beforeEach(() => {
      tries = 0
      const _handleAuthError = wrapper.__get__('_handleAuthError')
      handleAuthErrorSpy = sinon.spy(_handleAuthError)
      wrapper.__set__('_handleAuthError', handleAuthErrorSpy)
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        } else if (tries % 2 === 1) {
          return { status: 200, json: () => { return 'success' } }
        } else {
          tries += 1
          return { status: 401, json: () => '' }
        }
      })
    })
    after(() => { wrapper = requireUncached('../index.js') })
    it('post', async () => {
      await wrapper.post(path, data)
      expect(handleAuthErrorSpy.calledWith(wrapper.post, path, data)).to.equal(true)
    })
    it('put', async () => {
      await wrapper.put(path, data)
      expect(handleAuthErrorSpy.calledWith(wrapper.put, path, data)).to.equal(true)
    })
    it('delete', async () => {
      await wrapper.deleteRequest(path)
      expect(handleAuthErrorSpy.calledWith(wrapper.deleteRequest, path)).to.equal(true)
    })
    it('get', async () => {
      await wrapper.get(path)
      expect(handleAuthErrorSpy.calledWith(wrapper.get, path)).to.equal(true)
    })
  })

  describe('getBibItems', () => {
    it('should recursively return all items from a given bib', async () => {
      const authStub = () => true
      wrapper.__set__('authenticate', authStub)
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        } else if (path === credsBase + 'items/?bibIds=bibId&fields=default,fixedFields,varFields&offset=0') {
          return { status: 200, json: () => { return { entries: Array(50).fill('item') } } }
        } else if (path === credsBase + 'items/?bibIds=bibId&fields=default,fixedFields,varFields&offset=50') {
          return { status: 200, json: () => { return { entries: Array(50).fill('item') } } }
        } else if (path === credsBase + 'items/?bibIds=bibId&fields=default,fixedFields,varFields&offset=100') {
          return { status: 200, json: () => { return { entries: Array(15).fill('item') } } }
        }
      })

      const items = await wrapper.getBibItems('bibId')
      expect(items.length).to.equal(115)
    })
  })

  describe('makes a request with the rights headers, method, path, and data', () => {
    let fetchCalls
    const data = { title: 'spaghetti' }
    beforeEach(() => {

      fetchCalls = []
      wrapper.config({ key: credsKey, secret: credsSecret, base: credsBase })
      wrapper.__set__('fetch', (path, options) => {
        fetchCalls.push({ path, options })
        if (path === credsBase + 'token' && options.headers.Authorization === 'Basic Y3JlZHNLZXk6Y3JlZHNTZWNyZXQ=') {
          return { status: 200, json: () => { return { access_token: '12345' } } }
        } else {
          return { status: 200, json: () => 'success' }
        }
      })
    })
    it('put', async () => {
      await wrapper.put('path', data)

      const putCalls = fetchCalls.filter(call => call.options.method === 'put')
      expect(putCalls.length).to.equal(1)
      expect(putCalls[0].options.headers.Authorization).to.equal('Bearer 12345')
      expect(putCalls[0].options.method).to.equal('put')
      expect(putCalls[0].path).to.equal(credsBase + 'path')
      expect(JSON.parse(putCalls[0].options.body)).to.deep.equal(data)
    })
    it('post', async () => {
      await wrapper.post('path', data)

      const postCalls = fetchCalls.filter(call => call.options.method === 'post')
      // 2 calls because the first one is auth post
      expect(postCalls.length).to.equal(2)
      expect(postCalls[1].options.headers.Authorization).to.equal('Bearer 12345')
      expect(postCalls[1].options.method).to.equal('post')
      expect(postCalls[1].path).to.equal(credsBase + 'path')
      expect(JSON.parse(postCalls[1].options.body)).to.deep.equal(data)
    })
    it('delete', async () => {
      await wrapper.deleteRequest('path')
      const deleteCalls = fetchCalls.filter(call => call.options.method === 'delete')
      expect(deleteCalls.length).to.equal(1)
      expect(deleteCalls[0].options.headers.Authorization).to.equal('Bearer 12345')
      expect(deleteCalls[0].options.method).to.equal('delete')
      expect(deleteCalls[0].path).to.equal(credsBase + 'path')
    })
    it('get', async () => {
      await wrapper.get('path')

      const getCalls = fetchCalls.filter(call => call.options.method === 'get')
      expect(getCalls.length).to.equal(1)
      expect(getCalls[0].options.headers.Authorization).to.equal('Bearer 12345')
      expect(getCalls[0].options.method).to.equal('get')
      expect(getCalls[0].path).to.equal(credsBase + 'path')
    })
  })
})
