# decap-server

The local proxy server for Decap CMS's `proxy` backend. Run it in the root of your site's repository and the CMS reads and writes files on disk instead of going through a git host:

```sh
npx decap-server
```

The CMS side needs only:

```yaml
local_backend: true
```

It needs Node 20 or later.

Settings are read from the environment, also from a `.env` file in the working directory: `PORT` (default 8081), `BIND_HOST`, `MODE` (`fs` or `git`, default `fs`), `GIT_REPO_DIRECTORY` (default the current directory), `ORIGIN` (default localhost and 127.0.0.1) and `LOG_LEVEL` (default `info`). In `git` mode changes are committed to the local repository and the editorial workflow works.

To mount the endpoints on your own Express app:

```js
const { registerLocalFs, registerLocalGit } = require('decap-server/dist/middlewares');
```

Since 3.11.4 the server code lives in the internal `@decap/cli` package, which this package depends on and runs. Nothing changes for `npx decap-server` users.
