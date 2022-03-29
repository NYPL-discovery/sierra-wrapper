# Installation Tests

These are installation tests for testing updates to the client.

 * Ready a feature branch of the client (e.g. SCC-123)
 * COPY the whole folder into a different tree to ensure `node_modules` of a parent directory does't cascade\*:
   - e.g. ```cp -R `pwd`/test/installation-test /tmp/sierra-wrapper-installation-test```
 * `cd /tmp/sierra-wrapper-installation-test`
 * Update `package.json` to use the branch tag (e.g. ".../sierra-wrapper.git#SCC-123")
 * `npm i`
 * See `./test-with-*` scripts

 \* See [Nodejs.org Loading from node_modules folders](https://nodejs.org/dist/latest-v12.x/docs/api/all.html#modules_loading_from_node_modules_folders). If a required module isn't found in the current app's `node_modules` directory, Node.js looks for a `node_modules` directory in each of the parent directories. We don't want a required module to resolve to the one installed in a parent `node_modules` directory; We want these installation tests to run in a clean environment so that we can catch missing dependencies.
