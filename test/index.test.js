/* global describe, it */

var should = require('should') // eslint-disable-line
var wrapper = require('../index.js')

describe('Tests', function () {
  this.timeout(150000)
  it('load config from file', () => {
    wrapper.loadConfig('./test/config.test.json')
    wrapper.credsKey.should.equal('key')
    wrapper.credsSecret.should.equal('secret')
    wrapper.credsBase.should.equal('base')
  })
  it('load config from object', () => {
    wrapper.loadConfig({key: 'key', secret: 'secret', base: 'base'})
    wrapper.credsKey.should.equal('key')
    wrapper.credsSecret.should.equal('secret')
    wrapper.credsBase.should.equal('base')
  })
})
