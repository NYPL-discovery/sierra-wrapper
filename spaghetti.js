const { config, authenticate, deleteRequest, put, post, get } = require('./index.js')

const doTheThing = async () => {
  config('test/installation-test/creds.json')
  authenticate()
  const patron = await post('/patrons', { names: ['duchess wazzinsky'] })
  const id = patron.link.split('patrons/')[1]
  let returnedPatron = await get('/patrons/' + id)
  console.log('first get', returnedPatron)
  await put('/patrons/' + id, { names: ['princess buttercup'] })
  returnedPatron = await get('/patrons/' + id + '?fields=names')
  console.log('second get', returnedPatron)
  const deleteResponse = await deleteRequest('/patrons/' + id)
  console.log(deleteResponse)
  returnedPatron = await get('/patrons/' + id)
  console.log('third get', returnedPatron)
}

doTheThing()
