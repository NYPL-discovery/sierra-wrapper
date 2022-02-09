/* global describe, it */
const MockAdapter = require('axios-mock-adapter')
const axios = require('axios')
const chai = require('chai')
const wrapper = require('../sierra-client.js')
const { expect } = chai
chai.use(require('chai-as-promised'));
const sinon = require('sinon')

describe('test', function () {
  beforeEach(function () {
    mockAxios = new MockAdapter(axios)
    wrapper.config({
      credsKey: "credsKey",
      credsSecret: "credsSecret",
      credsBase: "credsBase.com/"
    })
    auth = {
      'auth':
      {
        'user': "credsKey",
        'pass': "credsSecret"
      }
    }
  })
  describe('authenticate', function () {
    xit('should throw an error if there are no credentials', async function () {
      await expect(wrapper.authenticate()).to.be.rejectedWith(`No credentials set`)
    })

    xit('should make an axios post request with the credentials', async function () {

      mockAxios.onPost(`credsBase.com/token`, auth)
        .reply(200, { "access_token": "12345" })
      await wrapper.authenticate()
      expect(wrapper._accessToken()).to.equal("12345")
    })
    xit('retries authentication 1x when given an empty response once', async () => {
      axiosSpy = sinon.spy(axios, 'post')
      mockAxios.onPost(`credsBase.com/token`, auth)
        .replyOnce(200, "")
        .onPost(`credsBase.com/token`, auth)
        .replyOnce(200, { "access_token": "12345" })
        await wrapper.authenticate()
        sinon.assert.calledTwice(axiosSpy)
    })
    it('throws a RetryError when auth fails 3 times', async () => {
      mockAxios.onPost(`credsBase.com/token`, auth)
        .reply(200, "")
      await expect(wrapper.authenticate()).to.be.rejectedWith(wrapper.RetryError, 
        "Authentication failed after 3 attempts with empty responses")

    })
  })

  describe('get', () => {
    //returns some data
    //calls reauthenticate
    //retries get when...
    //throws retry error

  })
})
