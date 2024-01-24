# sierra-wrapper

A basic node wrapper for the [III Sierra v3/v6 API](https://sandbox.iii.com/docs/Content/titlePage.htm)

The wrapper currently supports:

- Authorizing
- Returning a single, multiple and range Bib records
- Returning a single, multiple and range Item records
- Returning item records belonging to a single Bib record

In addition there are general methods that can be used to make any GET POST PUT 
or DELETE request:

- get
- post
- deleteRequest
- put

## Usage

Load the client as follows:
```
const wrapper = require('@nypl/sierra-wrapper')
```

### Authenticating

To configure credentials there are three options:

1. Store credentials in a json file in the format:

```
{
	"key": "YOURKEY",
	"secret": "YOURSECRET",
	"base": "https://your.domain.name.org/iii/sierra-api/v3/"
}
```
You then authorize and request by

```
const wrapper = require('@nypl/sierra-wrapper')

wrapper.config('./path/to/config.json')
```

2. You can pass in an options object with the same format as the json above, and pass it in to the same function

```
wrapper.config(options)
```

3. You can also set your credentials via environment variables: `SIERRA_KEY`, `SIERRA_SECRET`, `SIERRA_BASE`

### Querying

The following retrieves a bunch of bib ids:

```
const printBibIds = async () => {
  try {
    const bibs = await wrapper.get('bibs')
    console.log('Got bibs:', bibs.entries.map(b => b.id))
  } catch (e) {
    console.log(e.message)
  }
}
```

## API
### config(configOrFile) ⇒ <code>boolean</code>
Loads a config object, passed or from disk
**Returns**: <code>boolean</code> - did it load or not

| Param | Type | Description |
| --- | --- | --- |
| configOrFile | <code>object</code> &#124; <code>string</code> | The object with the credentials or a path to a json file with the credentials |

### authenticate()
Called internally to retrieve an access token before all calls. Requests an auth token from the sierra API and stores it for future use. It automatically reattempts when there is an empty response from Sierra (a not uncommon error).

### get(path)
Makes a get request to ${exports.credsBase}${path} and returns the response. It automatically reattempts when there is an empty response from Sierra (a not uncommon error).

resolves to the result:

```
{"id":1001006,"expirationDate":"2019-01-07","patronType":10,"patronCodes":{"pcode1":"-","pcode2":"-","pcode3":2,"pcode4":0},"homeLibraryCode":"hd","message":{"code":"-","accountMessages":["LBR6@columbia.edu"]}
```

### post(path, data)
Makes a post request to ${exports.credsBase}${path} and returns the response

resolves to the result:

{ code: 132,
	specificCode: 2,
	httpStatus: 500,
	name: 'XCirc error',
	description: 'XCirc error : Bib record cannot be loaded' }

### getSingleBib(bibId)
Requests a single bib data from the API

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| bibId | <code>string</code> | the bnumber of the bib you want to request |

### getRangeBib(bibIdStart, bibIdEnd)
Requests a bib range from the API

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| bibIdStart | <code>string</code> | the bnumber of the bib you want to request |
| bibIdEnd | <code>string</code> | the bnumber of the bib you want to request |

### getRangeItem(itemIdStart, itemIdEnd)
Requests an item range from the API

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| itemIdStart | <code>string</code> | the bnumber of the bib you want to request |
| itemIdEnd | <code>string</code> | the bnumber of the bib you want to request |

### getBibItems(bibId)
Requests all the items of a specified bib id
Return format:
[ [Object], [Object] ]

| Param | Type | Description |
| --- | --- | --- |
| bibId | <code>string</code> | the bnumber of the bib you want to request |

### getMultiBibBasic(bibsIds)
Requests multiple bibs, but no orders or locations

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| bibsIds | <code>array</code> | an array of bib id strings |


### getMultiItemBasic(itemIds)
Requests multiple items

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| itemIds | <code>array</code> | array of item ids |

## Contributing

1. Cut feature branch from master
2. Before making pull request, run npm version <update_type>, indicating patch, minor, or major changes, according to semantic versioning
3. After PR is approved, run npm publish
4. Go to your package page (https://npmjs.com/package/<package>) to check that the package version has been updated

## Testing

Run unit tests via:
```
npm test
```

See [./test/installation-test](./test/installation-test) for scripts to validate a release before publication.
