# sierra-wrapper

A basic node wrapper for the [III Sierra v3 API](https://sandbox.iii.com/docs/Content/titlePage.htm)

The wrapper currently only supports:

- Authorizing
- Returning a single, multiple and range Bib records
- Returning a single, multiple and range Item records
- Returning item records beloning to a single Bib record


More endpoint will be added as the need arises.

---

To use make sure you have your credentials stored in a json file in the format:

```
{
	"key": "YOURKEY",
	"secret": "YOURSECRET",
	"base": "https://your.domain.name.org/iii/sierra-api/v3/"
}
```
You then authorize and request by

```
var wrapper = require('sierra-wrapper')

var loadedConfig = wrapper.loadConfig('./path/to/config.json')
wrapper.auth((error, results) => {
  if (error) console.log(error)
  wrapper.requestRangeBib('14628261', '', (errorBibReq, results) => {
    if (errorBibReq) console.log(errorBibReq)
    console.log(results)
  })
})
```

You can also set your credentials via enviorment variables: `SIERRA_KEY`, `SIERRA_SECRET`, `SIERRA_BASE`

----

## Functions

<dl>
<dt><a href="#loadConfig">loadConfig(configOrFile)</a> ⇒ <code>boolean</code></dt>
<dd><p>Loads a congig object, passed or from disk</p>
</dd>
<dt><a href="#auth">auth(cb)</a></dt>
<dd><p>Requests an auth token from the sierra API and stores it for future use, it also setups a time to renew the token</p>
</dd>
<dt><a href="#requestSingleBib">requestSingleBib(bibId, cb)</a></dt>
<dd><p>Requests a single bib data from the API</p>
<p>Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: &#39;<a href="https://catalog.library.org/iii/sierra-api/v3/bibs/?limit=1&amp;id=17292415&amp;fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations">https://catalog.library.org/iii/sierra-api/v3/bibs/?limit=1&amp;id=17292415&amp;fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations</a>&#39; }</p>
</dd>
<dt><a href="#requestRangeBib">requestRangeBib(bibIdStart, bibIdEnd, cb)</a></dt>
<dd><p>Requests a bib range from the API</p>
<p>Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: &#39;<a href="https://catalog.library.org/iii/sierra-api/v3/bibs/?limit=1&amp;id=17292415&amp;fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations">https://catalog.library.org/iii/sierra-api/v3/bibs/?limit=1&amp;id=17292415&amp;fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations</a>&#39; }</p>
</dd>
<dt><a href="#requestRangeItem">requestRangeItem(itemIdStart, itemIdEnd, cb)</a></dt>
<dd><p>Requests an item range from the API</p>
<p>Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: &#39;<a href="https://catalog.library.org/iii/sierra-api/v3/items/?limit=1&amp;id=17292415&amp;fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations">https://catalog.library.org/iii/sierra-api/v3/items/?limit=1&amp;id=17292415&amp;fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations</a>&#39; }</p>
</dd>
<dt><a href="#requestBibItems">requestBibItems(bibId, cb)</a></dt>
<dd><p>Requests all the items of a specified bib id
Return format:
{ data: { total: 2, entries: [ [Object], [Object] ] },
  url: [ &#39;<a href="https://catalog.library.org/iii/sierra-api/v3/items/?bibIds=17292415&amp;fields=default,fixedFields,varFields&amp;offset=0">https://catalog.library.org/iii/sierra-api/v3/items/?bibIds=17292415&amp;fields=default,fixedFields,varFields&amp;offset=0</a>&#39; ] }</p>
</dd>
<dt><a href="#requestMultiBibBasic">requestMultiBibBasic(bibsIds, cb)</a></dt>
<dd><p>Requests multiple bibs, but no orders or locations</p>
<p>Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: &#39;<a href="https://catalog.library.org/iii/sierra-api/v3/bibs/?id=14628261,14628262,14628263,14628264,14628265,14628266,14628267,14628268,14628269,14628270&amp;fields=default,fixedFields,varFields,normTitle,normAuthor">https://catalog.library.org/iii/sierra-api/v3/bibs/?id=14628261,14628262,14628263,14628264,14628265,14628266,14628267,14628268,14628269,14628270&amp;fields=default,fixedFields,varFields,normTitle,normAuthor</a>&#39; }</p>
</dd>
<dt><a href="#requestMultiItemBasic">requestMultiItemBasic(itemIds, cb)</a></dt>
<dd><p>Requests multiple items</p>
<p>Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: &#39;<a href="https://catalog.library.org/iii/sierra-api/v3/items/?id=10000000,10000100,10000200,10000300,10000400,10000500,10000600,10000700,10000800,10000900,10001000&amp;fields=default,fixedFields,varFields">https://catalog.library.org/iii/sierra-api/v3/items/?id=10000000,10000100,10000200,10000300,10000400,10000500,10000600,10000700,10000800,10000900,10001000&amp;fields=default,fixedFields,varFields</a>&#39; }</p>
</dd>
</dl>

<a name="loadConfig"></a>

## loadConfig(configOrFile) ⇒ <code>boolean</code>
Loads a congig object, passed or from disk

**Kind**: global function
**Returns**: <code>boolean</code> - did it load or not

| Param | Type | Description |
| --- | --- | --- |
| configOrFile | <code>object</code> &#124; <code>string</code> | The object with the credentials or a path to a json file with the credentials |

<a name="auth"></a>

## auth(cb)
Requests an auth token from the sierra API and stores it for future use, it also setups a time to renew the token

**Kind**: global function

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback |

<a name="requestSingleBib"></a>

## requestSingleBib(bibId, cb)
Requests a single bib data from the API

Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: 'https://catalog.library.org/iii/sierra-api/v3/bibs/?limit=1&id=17292415&fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations' }

**Kind**: global function

| Param | Type | Description |
| --- | --- | --- |
| bibId | <code>string</code> | the bnumber of the bib you want to request |
| cb | <code>function</code> | callback |

<a name="requestRangeBib"></a>

## requestRangeBib(bibIdStart, bibIdEnd, cb)
Requests a bib range from the API

Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: 'https://catalog.library.org/iii/sierra-api/v3/bibs/?limit=1&id=17292415&fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations' }

**Kind**: global function

| Param | Type | Description |
| --- | --- | --- |
| bibIdStart | <code>string</code> | the bnumber of the bib you want to request |
| bibIdEnd | <code>string</code> | the bnumber of the bib you want to request |
| cb | <code>function</code> | callback |

<a name="requestRangeItem"></a>

## requestRangeItem(itemIdStart, itemIdEnd, cb)
Requests an item range from the API

Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: 'https://catalog.library.org/iii/sierra-api/v3/items/?limit=1&id=17292415&fields=default,fixedFields,varFields,normTitle,normAuthor,orders,locations' }

**Kind**: global function

| Param | Type | Description |
| --- | --- | --- |
| itemIdStart | <code>string</code> | the bnumber of the bib you want to request |
| itemIdEnd | <code>string</code> | the bnumber of the bib you want to request |
| cb | <code>function</code> | callback |

<a name="requestBibItems"></a>

## requestBibItems(bibId, cb)
Requests all the items of a specified bib id
Return format:
{ data: { total: 2, entries: [ [Object], [Object] ] },
  url: [ 'https://catalog.library.org/iii/sierra-api/v3/items/?bibIds=17292415&fields=default,fixedFields,varFields&offset=0' ] }

**Kind**: global function

| Param | Type | Description |
| --- | --- | --- |
| bibId | <code>string</code> | the bnumber of the bib you want to request |
| cb | <code>function</code> | callback |

<a name="requestMultiBibBasic"></a>

## requestMultiBibBasic(bibsIds, cb)
Requests multiple bibs, but no orders or locations

Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: 'https://catalog.library.org/iii/sierra-api/v3/bibs/?id=14628261,14628262,14628263,14628264,14628265,14628266,14628267,14628268,14628269,14628270&fields=default,fixedFields,varFields,normTitle,normAuthor' }

**Kind**: global function

| Param | Type | Description |
| --- | --- | --- |
| bibsIds | <code>array</code> | an array of bib id strings |
| cb | <code>function</code> | callback |

<a name="requestMultiItemBasic"></a>

## requestMultiItemBasic(itemIds, cb)
Requests multiple items

Return format:
{ data: { total: 1, entries: [ [Object] ] },
 url: 'https://catalog.library.org/iii/sierra-api/v3/items/?id=10000000,10000100,10000200,10000300,10000400,10000500,10000600,10000700,10000800,10000900,10001000&fields=default,fixedFields,varFields' }

**Kind**: global function

| Param | Type | Description |
| --- | --- | --- |
| itemIds | <code>array</code> | array of item ids |
| cb | <code>function</code> | callback |
