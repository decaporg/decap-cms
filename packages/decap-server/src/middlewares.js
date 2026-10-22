// Kept so `require('decap-server/dist/middlewares')` keeps working. The
// implementation now lives in `@decap/cli/dev`.
const { registerLocalFs, registerLocalGit } = require('@decap/cli/dev');

module.exports = { registerLocalFs, registerLocalGit };
