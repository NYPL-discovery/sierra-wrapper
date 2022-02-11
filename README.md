# sierra-wrapper

A basic node wrapper for the [III Sierra v3 API](https://sandbox.iii.com/docs/Content/titlePage.htm)

The wrapper currently supports:

- Authorizing
- Returning a single, multiple and range Bib records
- Returning a single, multiple and range Item records
- Returning item records belonging to a single Bib record

In addition there are general methods that can be used to make any GET or POST
request:

- get
- post

More endpoint will be added as the need arises.

---

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

----

## config(configOrFile) ⇒ <code>boolean</code>
Loads a config object, passed or from disk
**Returns**: <code>boolean</code> - did it load or not

| Param | Type | Description |
| --- | --- | --- |
| configOrFile | <code>object</code> &#124; <code>string</code> | The object with the credentials or a path to a json file with the credentials |

## authenticate()
Requests an auth token from the sierra API and stores it for future use. It automatically reattempts when there is an empty response from Sierra (a not uncommon error).


## get(path)
Makes a get request to ${exports.credsBase}${path} and returns the response

resolves to the result:

{"id":1001006,"expirationDate":"2019-01-07","patronType":10,"patronCodes":{"pcode1":"-","pcode2":"-","pcode3":2,"pcode4":0},"homeLibraryCode":"hd","message":{"code":"-","accountMessages":["LBR6@columbia.edu"]}

## post(path, data)
Makes a post request to ${exports.credsBase}${path} and returns the response

resolves to the result:

{ code: 132,
	specificCode: 2,
	httpStatus: 500,
	name: 'XCirc error',
	description: 'XCirc error : Bib record cannot be loaded' }

## getSingleBib(bibId)
Requests a single bib data from the API

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| bibId | <code>string</code> | the bnumber of the bib you want to request |

## getRangeBib(bibIdStart, bibIdEnd)
Requests a bib range from the API

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| bibIdStart | <code>string</code> | the bnumber of the bib you want to request |
| bibIdEnd | <code>string</code> | the bnumber of the bib you want to request |

## getRangeItem(itemIdStart, itemIdEnd)
Requests an item range from the API

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| itemIdStart | <code>string</code> | the bnumber of the bib you want to request |
| itemIdEnd | <code>string</code> | the bnumber of the bib you want to request |

## getBibItems(bibId)
Requests all the items of a specified bib id
Return format:
[ [Object], [Object] ]

| Param | Type | Description |
| --- | --- | --- |
| bibId | <code>string</code> | the bnumber of the bib you want to request |

## getMultiBibBasic(bibsIds)
Requests multiple bibs, but no orders or locations

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| bibsIds | <code>array</code> | an array of bib id strings |


## getMultiItemBasic(itemIds)
Requests multiple items

Return format:
[Object]

| Param | Type | Description |
| --- | --- | --- |
| itemIds | <code>array</code> | array of item ids |





