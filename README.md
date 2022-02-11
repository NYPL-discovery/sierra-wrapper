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

## Functions

<dl>
<dt><a href="#loadConfig">config(configOrFile)</a> ⇒ <code>boolean</code></dt>
<dd><p>Loads a config object, passed or from disk</p>
</dd>
<dt><a href="#authenticate">authenticate()</a></dt>
<dd><p>Requests an auth token from the sierra API and stores it for future use. It automatically reattempts when there is an empty response from Sierra (a not uncommon error).</p>
</dd>
<dt><a href="#get">get(path)</a></dt>
<dd><p>Makes a get request to the base URL (set in #config) + path. It automatically reattempts when there is an empty response from Sierra (a not uncommon error).</p>
</dd>
<dt><a href="#post">post(path, data)</a></dt>
<dd><p>Makes a post request with data to the base URL (set in #config) + path. It does not automatically reattempt when there is an empty response from Sierra (a not uncommon error).</p>
</dd>
<dt><a href="#getSingleBib">getSingleBib(bibId)</a></dt>
<dd><p>Requests a single bib data from the API</p>
<p>Return format:
[Object]
</p>
</dd>
<dt><a href="#getRangeBib">getRangeBib(bibIdStart, bibIdEnd)</a></dt>
<dd><p>Requests a bib range from the API</p>
<p>Return format:
[Object]
 </p>
</dd>
<dt><a href="#getRangeItem">getRangeItem(itemIdStart, itemIdEnd)</a></dt>
<dd><p>Requests an item range from the API</p>
<p>Return format:
[Object]
</p>
</dd>
<dt><a href="#getBibItems">getBibItems(bibId)</a></dt>
<dd><p>Requests all the items of a specified bib id
Return format:
[ [Object], [Object] ]
</p>
</dd>
<dt><a href="#getMultiBibBasic">getMultiBibBasic(bibsIds)</a></dt>
<dd><p>Requests multiple bibs, but no orders or locations</p>
<p>Return format:
[Object]
</p>
</dd>
<dt><a href="#getMultiItemBasic">getMultiItemBasic(itemIds)</a></dt>
<dd><p>Requests multiple items</p>
<p>Return format:
[Object]
</p>
</dd>
</dl>

