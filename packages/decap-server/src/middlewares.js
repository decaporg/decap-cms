// Kept so `require('decap-server/dist/middlewares')` keeps working. The
// implementation now lives in `decap/dev`.
const { registerLocalFs, registerLocalGit } = require('decap/dev');

module.exports = { registerLocalFs, registerLocalGit };
