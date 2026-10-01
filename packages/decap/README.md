# decap

The Decap command line, and a local MCP server for AI agents. Today it manages [Decap Turbo](https://turbo.decapcms.org): everything goes through the Turbo API with a personal access token, so it can never do more than you can in the dashboard.

## Sign in

```sh
npx decap login          # opens the browser; approve, and a token is stored
npx decap login --admin  # also request admin scope (manage sites and members)
npx decap whoami
npx decap logout         # revokes the token and forgets it
```

The token is stored in `~/.config/decap/credentials.json` (mode 0600). In CI, set `DECAP_TOKEN` to a token created under **API tokens** in the dashboard instead.

## Use it from an AI agent

`decap mcp` is a local MCP server. Sign in once with `login`, then add it to your agent.

**Claude Code**

```sh
claude mcp add decap -- npx -y decap mcp
```

**Claude Desktop, Cursor, and other clients that take a JSON config**

```json
{
  "mcpServers": {
    "decap": { "command": "npx", "args": ["-y", "decap", "mcp"] }
  }
}
```

## Developing

The API contract (operations, input schemas, MCP tool metadata) is the [`decap-turbo-api`](../decap-turbo-api) package, shared with the Turbo server. It is bundled into `dist/cli.js` at build time, so the published CLI does not depend on it at runtime.

```sh
pnpm install            # from the repository root
pnpm --filter decap build   # dist/cli.js
pnpm --filter decap test
pnpm run type-check     # from the repository root
```

Against a local Turbo (the Turbo app on port 4321):

```sh
node dist/cli.js login --api-url http://localhost:4321
node dist/cli.js whoami
```

Until the package is on npm, `npx decap` 404s, so point your agent at the local build instead. The stored credentials remember the API URL, so no extra env is needed:

```sh
claude mcp add decap-local --scope user -- node /absolute/path/to/decap-cms/packages/decap/dist/cli.js mcp
```

`claude mcp add` defaults to the current project's scope; `--scope user` makes it available in every session. Start a new Claude Code session afterwards: MCP servers are loaded at startup.
