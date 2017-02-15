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

  it('It should request an auth token - and work', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((error, results) => {
      if (error) console.log(error)
      results.should.be.type('string')
      wrapper.authorizedTimestamp.should.be.type('number')
      done()
    })
  })
  it('It should request an auth token - and not work', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.credsSecret = 'BANANANAANANANANAN'
    wrapper.auth((error, results) => {
      if (error) console.log(error)
      results.should.equal(false)
      wrapper.authorizedTimestamp.should.equal(false)
      done()
    })
  })

  it('It should request a single full bib record', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestSingleBib('17292415', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(1)
        done()
      })
    })
  })

  it('It should request the items associated with a bib id - Two items', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestBibItems('17292415', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(2)
        done()
      })
    })
  })

  it('It should request the items associated with a bib id - A lot of items', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestBibItems('10568020', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(1029)
        done()
      })
    })
  })

  it('It should request the items associated with a bib id - A lot of items 2', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestBibItems('14628261', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(813)
        // console.log(JSON.stringify(results, null, 2))
        console.log(JSON.stringify(results.data))

        done()
      })
    })
  })
  it('It should request a range of bib record', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestRangeBib('14628261', '', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(50)
        console.log(results)
        done()
      })
    })
  })
  it('It should request a range of items record', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestRangeItem('10000000', '', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(50)
        console.log(results)
        console.log(JSON.stringify(results, null, 2))
        done()
      })
    })
  })
      it('It should request multiple bib records', (done) => {
      var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
      if (!loadedConfig) {
        console.log('No config: test/config.real.test.json was not found, no test credentials to use')
      }
      wrapper.auth((errorAuth, results) => {
        if (errorAuth) console.log(errorAuth)
        wrapper.requestMultiBibBasic(['14628261','14628262','14628263','14628264','14628265','14628266','14628267','14628268','14628269','14628270'], (errorBibReq, results) => {
          if (errorBibReq) console.log(errorBibReq)
          results.data.total.should.equal(10)
          // console.log(JSON.stringify(results,null,2))
          done()
        })
      })
    })
    it('It should request multiple item records', (done) => {
    var loadedConfig = wrapper.loadConfig('./test/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestMultiItemBasic(['10000000','10000100','10000200','10000300','10000400','10000500','10000600','10000700','10000800','10000900','10001000'], (errorItemReq, results) => {
        if (errorItemReq) console.log(errorItemReq)
        results.data.total.should.equal(11)
        // console.log(JSON.stringify(results,null,2))
        done()
      })
    })
  })

})
