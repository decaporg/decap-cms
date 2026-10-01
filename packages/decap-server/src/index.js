// decap-server is now `decap dev` (packages/decap). This package stays so
// `npx decap-server` and existing setups keep working; it only starts the
// same server.
const { runDevServer } = require('decap/dev');

runDevServer().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
