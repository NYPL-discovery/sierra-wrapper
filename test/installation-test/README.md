# Installation Tests

These are installation tests for testing updates to the client.

 * Ready a feature branch of the client (e.g. SCC-123)
 * `cd test/installation-tests`
 * Update `package.json` to use the branch tag (e.g. ".../sierra-wrapper.git#SCC-123")
 * `npm i`
 * See `./test-with-*` scripts
