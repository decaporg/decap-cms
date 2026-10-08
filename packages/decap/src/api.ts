import { buildRequest, operations, type Operation } from 'decap-turbo-api';

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

    // Path segments, query and body come from the contract's buildRequest, so
    // the CLI and the MCP server address the API the same way.
    const request = buildRequest(op, input);
    const url = new URL(`${this.apiUrl}/api/v1${request.path}`);
    for (const [key, value] of Object.entries(request.query)) url.searchParams.set(key, value);

    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': `decap-cli/${CLI_VERSION} (${this.client})`,
      'x-decap-client': this.client,
    };
    if (op.auth === 'token' && this.token) headers.authorization = `Bearer ${this.token}`;

    let body: string | undefined;
    if (op.method !== 'GET') {
      // On every non-GET, even a body-less DELETE: Astro's cross-site check
      // refuses a mutating request with no Content-Type and no matching
      // Origin, and a CLI sends no Origin.
      headers['content-type'] = 'application/json';
      if (request.body) body = JSON.stringify(request.body);
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

  /**
   * Throws unless `apiUrl` serves the CLI API. Asked by `login` before it opens
   * a browser: on an instance without the API, /cli/authorize lands on the
   * dashboard's login page and never calls back, and the CLI used to wait out
   * its full five minutes. An unauthenticated GET /me answers a contract
   * instance with the contract's `{ error: { code, message } }`; anything else
   * — an HTML page, a redirect, an older `{ error: "..." }` — means no API.
   */
  async assertCliApi(): Promise<void> {
    const path = `/api/v1${operations.me.path}`;
    let response: Response;
    try {
      response = await fetch(`${this.apiUrl}${path}`, {
        headers: {
          accept: 'application/json',
          'user-agent': `decap-cli/${CLI_VERSION} (${this.client})`,
          'x-decap-client': this.client,
        },
        redirect: 'manual',
      });
    } catch (err) {
      throw new ApiError(
        0,
        'network_error',
        `Could not reach ${this.apiUrl}: ${(err as Error).message}`,
      );
    }

    let error: { code?: unknown; message?: unknown } | undefined;
    try {
      error = JSON.parse(await response.text())?.error;
    } catch {
      // Not JSON: not the API.
    }
    if (typeof error?.code === 'string' && typeof error?.message === 'string') return;
    throw new ApiError(
      response.status,
      'cli_unsupported',
      `${this.apiUrl} does not support the decap CLI yet: GET ${path} answered ${response.status} ` +
        'without the API’s error shape. Pass --api-url (or set DECAP_API_URL) to sign in to a ' +
        'Turbo instance that does.',
    );
  }
}

export { operations };
