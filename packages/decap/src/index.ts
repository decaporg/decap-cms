import { ApiClient, ApiError, CLI_VERSION, operations } from './api.js';
import { parseCliArgs } from './args.js';
import { credentialsPath, deleteCredentials, resolveAuth } from './config.js';
import { login } from './login.js';
import { serveMcp } from './mcp.js';

import type { MeResponse } from 'decap-turbo-api';

const HELP = `decap ${CLI_VERSION} — the Decap command line

Usage:
  decap dev                 Run the local proxy server for the CMS's proxy
                            backend (formerly npx decap-server)

  decap login [--admin]     Sign in to Decap Turbo and store a token
  decap logout              Revoke the stored token and forget it
  decap whoami [--json]     Show the signed-in user and their organizations
  decap mcp                 Run the local MCP server for AI agents

dev options (each overrides the matching variable, also read from .env):
  --port <n>        PORT, default 8081
  --host <addr>     BIND_HOST, listen on this address only
  --mode <fs|git>   MODE, default fs; git commits and supports the
                    editorial workflow
  --dir <path>      GIT_REPO_DIRECTORY, default the current directory
  --origin <url>    ORIGIN allowed to call the server, default localhost
  --log-level <l>   LOG_LEVEL, default info

Turbo options:
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
  function str(name: string): string | undefined {
    const value = parsed[name];
    return typeof value === 'string' ? value : undefined;
  }
  const values = {
    apiUrl: str('api-url'),
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
    case 'dev': {
      // Loaded only for this command: the proxy server brings Express and
      // simple-git, which login/whoami/mcp have no use for.
      const { runDevServer } = await import('./dev/server.js');
      const port = str('port');
      if (port !== undefined && !/^\d+$/.test(port)) throw new Error('--port must be a number.');
      await runDevServer({
        port: port === undefined ? undefined : Number(port),
        host: str('host'),
        mode: str('mode'),
        dir: str('dir'),
        origin: str('origin'),
        logLevel: str('log-level'),
      });
      return -1; // keep serving
    }

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
