import { operations, type Operation } from 'decap-turbo-api';

// Injected from package.json by webpack's DefinePlugin, so lerna's version bump
// is the only place the version lives. Unset under jest.
export const CLI_VERSION = typeof DECAP_CLI_VERSION === 'string' ? DECAP_CLI_VERSION : '0.0.0-dev';

// Plain fields rather than constructor parameter properties: the sources must
// stay erasable TypeScript so `node --experimental-strip-types` runs the tests.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Which client is calling, for the API's telemetry: a person at the CLI, or an agent through MCP. */
export type ClientKind = 'cli' | 'mcp';

export class ApiClient {
  readonly apiUrl: string;
  readonly token: string | null;
  readonly client: ClientKind;

  constructor(apiUrl: string, token: string | null, client: ClientKind = 'cli') {
    this.apiUrl = apiUrl;
    this.token = token;
    this.client = client;
  }

  async call<T>(op: Operation, input: Record<string, unknown> = {}): Promise<T> {
    if (op.auth === 'token' && !this.token) {
      throw new ApiError(
        401,
        'not_logged_in',
        'Not signed in. Run `npx decap login` in a terminal.',
      );
    }

    const url = new URL(`${this.apiUrl}/api/v1${op.path}`);
    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': `decap-cli/${CLI_VERSION} (${this.client})`,
      'x-decap-client': this.client,
    };
    if (op.auth === 'token' && this.token) headers.authorization = `Bearer ${this.token}`;

    let body: string | undefined;
    if (op.method === 'GET' || op.method === 'DELETE') {
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
    } else {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(input);
    }

    let response: Response;
    try {
      response = await fetch(url, { method: op.method, headers, body, redirect: 'manual' });
    } catch (err) {
      throw new ApiError(
        0,
        'network_error',
        `Could not reach ${this.apiUrl}: ${(err as Error).message}`,
      );
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // Not JSON: a proxy error page, or the password wall on a non-production deploy.
    }

    if (!response.ok) {
      const error = (parsed as { error?: { code?: string; message?: string } } | null)?.error;
      throw new ApiError(
        response.status,
        error?.code ?? 'http_error',
        error?.message ?? `${op.method} ${url.pathname} answered ${response.status}.`,
      );
    }
    if (parsed === null) {
      throw new ApiError(
        response.status,
        'bad_response',
        `${url.pathname} did not answer with JSON. Is ${this.apiUrl} a Turbo API?`,
      );
    }
    return parsed as T;
  }
}

export { operations };
