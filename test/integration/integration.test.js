var should = require('should') // eslint-disable-line
const wrapper = require('../../index.js')

describe('Tests', function () {
  this.timeout(150000)
  it('Should request an auth token - and work', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
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
  it('Should request an auth token - and return a promise', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.promiseAuth((error, results) => {
      if (error) console.log(error)
      return results
    })
      .then((results) => {
        results.should.be.type('string')
      })
      .then(done, done)
  })
  it('Should request an auth token - and not work', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
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

  it('Should request a single full bib record', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
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

  it('Should request the items associated with a bib id - Two items', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
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

  it('Should request the items associated with a bib id - A lot of items', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
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

  it('Should request the items associated with a bib id - A lot of items 2', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestBibItems('14628261', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(813)
        done()
      })
    })
  })
  it('Should request a range of bib record', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
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
  it('Should request a range of items record', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestRangeItem('10000000', '', (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(50)
        done()
      })
    })
  })
  it('Should request multiple bib records', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestMultiBibBasic(['14628261', '14628262', '14628263', '14628264', '14628265', '14628266', '14628267', '14628268', '14628269', '14628270'], (errorBibReq, results) => {
        if (errorBibReq) console.log(errorBibReq)
        results.data.total.should.equal(10)
        done()
      })
    })
  })
  it('Should request multiple item records', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.auth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      wrapper.requestMultiItemBasic(['10000000', '10000100', '10000200', '10000300', '10000400', '10000500', '10000600', '10000700', '10000800', '10000900', '10001000'], (errorItemReq, results) => {
        if (errorItemReq) console.log(errorItemReq)
        results.data.total.should.equal(11)
        done()
      })
    })
  })
  it('Should make a get request and then call the callback', (done) => {
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.promiseAuth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      return wrapper.apiGet('patrons/1001006', (errorItemReq, results) => {
        if (errorItemReq) console.log(errorItemReq)
        return results
      })
    })
      .then((results) => {
        results.should.be.type('object')
      })
      .then(done, done)
  })
  it('Should make a post request and then call the callback', (done) => {
    const body = {
      json: true,
      method: 'POST',
      body: {
        recordType: 'i',
        recordNumber: 10000000,
        pickupLocation: 'maii2'
      }
    }
    const expectedResults = {
      code: 132,
      specificCode: 2,
      httpStatus: 500,
      name: 'XCirc error',
      description: 'XCirc error : Bib record cannot be loaded'
    }
    const loadedConfig = wrapper.loadConfig('./test/integration/config.real.test.json')
    if (!loadedConfig) {
      console.log('No config: test/config.real.test.json was not found, no test credentials to use')
    }
    wrapper.promiseAuth((errorAuth, results) => {
      if (errorAuth) console.log(errorAuth)
      return wrapper.apiPost('patrons/1001006/holds/requests', body, (errorItemReq, results) => {
        if (errorItemReq) return errorItemReq
        return false
      })
    })
      .then((results) => {
        console.log(results)
        results.should.deepEqual(expectedResults)
      })
      .then(done, done)
  })
})
