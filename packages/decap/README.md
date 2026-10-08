# @decap/cli

The Decap command line, installed as the `decap` command. It runs the local proxy server for editing a site on your own machine, manages [Decap Turbo](https://turbo.decapcms.org), and connects AI agents to Turbo over MCP. Turbo commands go through the Turbo API with a personal access token, so they can never do more than you can in the dashboard.

It needs Node 20 or later.

## Local development: `decap dev`

Runs the proxy server for Decap's `proxy` backend, so the CMS reads and writes the repository on disk. This was `npx decap-server`, which still works and runs the same server.

```sh
npx @decap/cli dev                 # serve the current directory on port 8081
npx @decap/cli dev --mode git      # commit changes, with editorial workflow support
npx @decap/cli dev --port 8082 --dir ../my-site
```

Point the CMS at it:

```yaml
local_backend: true
```

or, explicitly:

```yaml
backend:
  name: proxy
  proxy_url: http://localhost:8081/api/v1
```

Each flag overrides an environment variable, also read from a `.env` file in the working directory: `--port` (`PORT`, default 8081), `--host` (`BIND_HOST`), `--mode` (`MODE`: `fs` or `git`, default `fs`), `--dir` (`GIT_REPO_DIRECTORY`, default the current directory), `--origin` (`ORIGIN`, the CMS origin allowed to call the server, default localhost) and `--log-level` (`LOG_LEVEL`, default `info`).

To mount the proxy endpoints on your own Express app instead:

```js
const { registerLocalFs, registerLocalGit } = require('@decap/cli/dev');

await registerLocalFs(app); // or registerLocalGit(app)
```

## Sign in

```sh
npx @decap/cli login          # opens the browser; approve, and a token is stored
npx @decap/cli login --admin  # also request admin scope (manage sites and members)
npx @decap/cli whoami
npx @decap/cli logout         # revokes the token and forgets it
```

The token is stored in `~/.config/decap/credentials.json` (mode 0600). In CI, set `DECAP_TOKEN` to a token created under **API tokens** in the dashboard instead.

## Manage Turbo

Every Turbo API operation is a command. `decap --help` lists them; `decap <command> --help` shows its flags.

```sh
decap orgs list
decap sites list --org <org-id>
decap sites create --org <org-id> --name "Marketing site" --repo acme/marketing
decap sites update --site <site-id> --branch develop
decap cache clear --site <site-id>
decap deploys list --site <site-id> --limit 5
decap members invite --org <org-id> --email someone@example.com
decap members set-role --org <org-id> --member someone@example.com --role owner
decap site-members add --site <site-id> --member someone@example.com
```

Members can be named by email or user id. Add `--json` for machine-readable output. Commands that change something need a token with admin scope (`decap login --admin`) and an organization owner behind it, the same as in the dashboard.

## Edit the open entry

When you have an entry open in a Turbo-backed CMS, an agent (or you) can change its fields there without saving: the change appears highlighted in your editor, for you to review and save.

```sh
decap editor list                                  # entries you have open, with their fields and values
decap editor set --session <id> --fields '{"title": "New title", "seo.description": "…"}'
decap editor open --site <site-id> --collection posts --slug hello   # the CMS link for an entry
```

The editor bridge is experimental and off by default: turn it on for a site with `editor_bridge: true` under `backend` in config.yml. While it is on, the CMS shows a small "Agent bridge on" badge while an entry is open; its × turns the bridge off for that tab.

## Use it from an AI agent

`decap mcp` is a local MCP server. Sign in once with `login`, then add it to your agent.

**Claude Code**

```sh
claude mcp add decap -- npx -y @decap/cli mcp
```

**Claude Desktop, Cursor, and other clients that take a JSON config**

```json
{
  "mcpServers": {
    "decap": { "command": "npx", "args": ["-y", "@decap/cli", "mcp"] }
  }
}
```

## Developing

The API contract (operations, input schemas, MCP tool metadata) is the [`decap-turbo-api`](../decap-turbo-api) package, shared with the Turbo server. It is bundled into `dist/cli.cjs` at build time, so the published CLI does not depend on it at runtime.

```sh
pnpm install            # from the repository root
pnpm --filter @decap/cli build   # dist/cli.cjs
pnpm --filter @decap/cli test
pnpm run type-check     # from the repository root
```

Against a local Turbo (the Turbo app on port 4321):

```sh
node dist/cli.cjs login --api-url http://localhost:4321
node dist/cli.cjs whoami
```

To try changes to the CLI with an agent, point the agent at the local build. The stored credentials remember the API URL, so no extra env is needed:

```sh
claude mcp add decap-local --scope user -- node /absolute/path/to/decap-cms/packages/decap/dist/cli.cjs mcp
```

`claude mcp add` defaults to the current project's scope; `--scope user` makes it available in every session. Start a new Claude Code session afterwards: MCP servers are loaded at startup.
