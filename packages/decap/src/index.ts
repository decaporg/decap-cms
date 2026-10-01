import { ApiClient, ApiError, CLI_VERSION, operations } from './api.js';
import { parseCliArgs } from './args.js';
import { credentialsPath, deleteCredentials, resolveAuth } from './config.js';
import { login } from './login.js';
import { serveMcp } from './mcp.js';

import type { MeResponse } from 'decap-turbo-api';

const HELP = `decap ${CLI_VERSION} — the Decap command line

Today it manages Decap Turbo from your terminal and your AI agents.

Usage:
  decap login [--admin]     Sign in through the browser and store a token
  decap logout              Revoke the stored token and forget it
  decap whoami [--json]     Show the signed-in user and their organizations
  decap mcp                 Run the local MCP server (for Claude, Cursor, …)

Options:
  --api-url <url>   Turbo instance (default https://turbo.decapcms.org,
                    or DECAP_API_URL)
  --admin           login: also request admin scope (manage sites and members)
  --json            Machine-readable output
  -h, --help        Show this help
  -v, --version     Show the version

Environment:
  DECAP_TOKEN   Use this token instead of the stored one (CI)
`;

async function main(argv: string[]): Promise<number> {
  const { flags: parsed, positionals } = parseCliArgs(argv);
  const values = {
    apiUrl: typeof parsed['api-url'] === 'string' ? parsed['api-url'] : undefined,
    admin: parsed.admin === true,
    json: parsed.json === true,
    help: parsed.help === true,
    version: parsed.version === true,
  };

  if (values.version) {
    console.log(CLI_VERSION);
    return 0;
  }

  const [command] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return values.help ? 0 : 1;
  }

  const flags = { apiUrl: values.apiUrl };

  switch (command) {
    case 'login': {
      const { apiUrl } = resolveAuth(flags);
      await login({ apiUrl, admin: values.admin });
      return 0;
    }

    case 'logout': {
      const { apiUrl, token, stored } = resolveAuth(flags);
      if (stored && token === stored.token) {
        try {
          await new ApiClient(apiUrl, token).call(operations.revokeCurrentToken);
        } catch (err) {
          // Already revoked or expired: forgetting it locally is still right.
          if (!(err instanceof ApiError && err.status === 401)) throw err;
        }
      }
      console.log(
        deleteCredentials() ? `Signed out. Removed ${credentialsPath()}.` : 'Not signed in.',
      );
      if (process.env.DECAP_TOKEN) console.log('DECAP_TOKEN is still set in your environment.');
      return 0;
    }

    case 'whoami': {
      const { apiUrl, token } = resolveAuth(flags);
      const me = await new ApiClient(apiUrl, token).call<MeResponse>(operations.me);
      if (values.json) {
        console.log(JSON.stringify(me, null, 2));
        return 0;
      }
      console.log(
        `${me.user.name ? `${me.user.name} <${me.user.email}>` : me.user.email}  (${apiUrl})`,
      );
      if (me.token) {
        const expiry = me.token.expires_at
          ? `expires ${new Date(me.token.expires_at).toLocaleDateString()}`
          : 'no expiry';
        console.log(`Token: ${me.token.name} — ${me.token.scope} scope, ${expiry}`);
      }
      if (me.organizations.length === 0) {
        console.log('\nNo organizations yet.');
      } else {
        console.log('\nOrganizations:');
        for (const org of me.organizations)
          console.log(`  ${org.name}  ${org.role}, ${org.plan}  ${org.id}`);
      }
      return 0;
    }

    case 'mcp':
      await serveMcp(flags);
      return -1; // keep running; the transport owns the process from here

    default:
      console.error(`Unknown command "${command}".\n`);
      console.error(HELP);
      return 1;
  }
}

main(process.argv.slice(2)).then(
  code => {
    if (code >= 0) process.exitCode = code;
  },
  err => {
    if (err instanceof ApiError) {
      console.error(`✗ ${err.message}`);
    } else {
      console.error(`✗ ${(err as Error).message ?? err}`);
    }
    process.exitCode = 1;
  },
);
