# Changelog
### v1.1.1
Add error handling around failed authentication to indicate bad creds supplied

### v1.1.0
Update wrapper to expose post and delete requests

### v1.0.0
Refactor index.js to use promises instead of callbacks.
Empty Sierra Responses are retried up to three times for auth and get requests

### v0.3.0
Add methods apiGet, apiPost, and promiseAuth to index.js
Move integration tests from index.test.js to a separate integration folder. These
tests require a config.real.test.json

### v0.2.0
Adding module on npm as `@nypl/sierra-wrapper`.
