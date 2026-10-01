import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { validateInput, type MeResponse, type Operation, type Scope } from 'decap-turbo-api';

import { ApiClient, ApiError, CLI_VERSION, operations } from './api.js';
import { resolveAuth } from './config.js';

/**
 * `decap mcp`: a stdio MCP server whose tools are the contract's
 * operations, each one an API call made with the user's token. Any MCP client
 * that can launch a local process can use it — Claude Desktop, Claude Code,
 * Cursor, VS Code, Codex. Tool input schemas come straight from the contract,
 * so the low-level Server is used instead of McpServer's zod-based helpers.
 *
 * stdout belongs to the protocol: anything human-readable goes to stderr.
 */
export async function serveMcp(flags: { apiUrl?: string }): Promise<void> {
  const { apiUrl, token, stored } = resolveAuth(flags);
  const api = new ApiClient(apiUrl, token, 'mcp');

  if (process.stdin.isTTY) {
    console.error(
      'decap mcp is an MCP server and talks over stdin/stdout. Add it to your agent instead, e.g.\n' +
        '  claude mcp add decap -- npx -y decap mcp\n',
    );
  }

  // The token's scope decides which tools are listed. Known from the
  // credentials file after `login`; asked of the API for an env-var token.
  let scope: Promise<Scope | null> | null = null;
  function tokenScope(): Promise<Scope | null> {
    if (!token) return Promise.resolve(null);
    if (!scope) {
      scope =
        stored?.token === token
          ? Promise.resolve(stored.scope)
          : api
              .call<MeResponse>(operations.me)
              .then(me => me.token?.scope ?? null)
              .catch(() => null);
    }
    return scope;
  }

  const tools = Object.values(operations as Record<string, Operation>).filter(op => op.mcp);

  const server = new Server(
    { name: 'decap', version: CLI_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const granted = await tokenScope();
    return {
      tools: tools
        // Without a token every tool is listed, so an agent can tell the user to sign in.
        .filter(op => !granted || op.scope !== 'admin' || granted === 'admin')
        .map(op => ({
          name: op.mcp!.name,
          title: op.mcp!.title,
          description: op.summary,
          inputSchema: op.input as unknown as {
            type: 'object';
            properties?: Record<string, object>;
          },
          annotations: {
            title: op.mcp!.title,
            readOnlyHint: op.mcp!.readOnly,
            destructiveHint: op.mcp!.destructive ?? false,
            openWorldHint: false,
          },
        })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const op = tools.find(t => t.mcp!.name === request.params.name);
    if (!op) return toolError(`Unknown tool "${request.params.name}".`);

    const input = validateInput(op.input, request.params.arguments ?? {});
    if (!input.ok) return toolError(input.errors.join(' '));

    try {
      const result = await api.call<unknown>(op, input.value);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result ?? { ok: true }, null, 2) }],
      };
    } catch (err) {
      return toolError(
        err instanceof ApiError ? err.message : `Unexpected error: ${(err as Error).message}`,
      );
    }
  });

  await server.connect(new StdioServerTransport());
}

function toolError(message: string) {
  return { isError: true, content: [{ type: 'text' as const, text: message }] };
}
