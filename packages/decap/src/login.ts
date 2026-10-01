import crypto from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';

import { ApiClient, ApiError, operations } from './api.js';
import { writeCredentials } from './config.js';

import type { CliTokenResponse, MeResponse } from 'decap-turbo-api';

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

function page(title: string, message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#222}h1{font-size:1.4rem}</style>
</head><body><h1>${title}</h1><p>${message}</p></body></html>`;
}

/** For promise and event handlers whose failure is deliberately ignored. */
function ignore(): void {
  // Nothing to do: the caller has already reported or doesn't care.
}

/**
 * `decap login`: the loopback half of lib/services/cli-auth.ts in the
 * Astro app. A one-shot server on 127.0.0.1 receives the code; the PKCE
 * verifier never leaves this process until it is posted with the code.
 */
export async function login(options: { apiUrl: string; admin: boolean }): Promise<void> {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(24).toString('base64url');

  const { server, port, result } = await listenForCallback(state);

  const authorize = new URL(`${options.apiUrl}/cli/authorize`);
  authorize.searchParams.set('port', String(port));
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');
  authorize.searchParams.set('name', deviceName());
  if (options.admin) authorize.searchParams.set('scope', 'admin');

  console.log('Opening your browser to approve this device:');
  console.log(`\n  ${authorize}\n`);
  console.log(
    'If it does not open, copy the link above into a browser where you are signed in to Decap Turbo.',
  );
  openBrowser(authorize.toString());

  let code: string;
  try {
    code = await result;
  } finally {
    server.close();
  }

  const anonymous = new ApiClient(options.apiUrl, null);
  const issued = await anonymous.call<CliTokenResponse>(operations.cliToken, {
    code,
    code_verifier: verifier,
  });

  const me = await new ApiClient(options.apiUrl, issued.token).call<MeResponse>(operations.me);

  writeCredentials({
    apiUrl: options.apiUrl,
    token: issued.token,
    tokenId: issued.token_id,
    scope: issued.scope,
    expiresAt: issued.expires_at,
    email: me.user.email,
  });

  const expiry = issued.expires_at
    ? `, expires ${new Date(issued.expires_at).toLocaleDateString()}`
    : '';
  console.log(`\n✓ Signed in as ${me.user.email} (${issued.scope} scope${expiry}).`);
}

function listenForCallback(
  expectedState: string,
): Promise<{ server: http.Server; port: number; result: Promise<string> }> {
  return new Promise((resolveListening, rejectListening) => {
    let settle!: { resolve: (code: string) => void; reject: (err: Error) => void };
    const result = new Promise<string>((resolve, reject) => {
      settle = { resolve, reject };
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }

      function send(status: number, title: string, message: string) {
        res
          .writeHead(status, { 'content-type': 'text/html; charset=utf-8' })
          .end(page(title, message));
      }

      // Checked before anything else: a request without our state did not
      // come from the page we opened, so it must not end the wait either.
      if (url.searchParams.get('state') !== expectedState) {
        send(400, 'Login link mismatch', 'This does not match the login running in your terminal.');
        return;
      }

      const error = url.searchParams.get('error');
      if (error) {
        send(200, 'Login cancelled', 'You can close this tab.');
        settle.reject(
          new ApiError(
            0,
            error,
            error === 'access_denied'
              ? 'Login was denied in the browser.'
              : `Login failed: ${error}`,
          ),
        );
        return;
      }

      const code = url.searchParams.get('code');
      if (!code) {
        send(400, 'Login failed', 'The callback carried no code. Run decap login again.');
        return;
      }

      send(200, 'decap is signed in', 'You can close this tab and return to your terminal.');
      settle.resolve(code);
    });

    const timer = setTimeout(
      () =>
        settle.reject(new ApiError(0, 'timeout', 'Timed out waiting for approval in the browser.')),
      LOGIN_TIMEOUT_MS,
    );
    result.finally(() => clearTimeout(timer)).catch(ignore);

    server.on('error', rejectListening);
    // 127.0.0.1 explicitly, not `localhost`: /cli/authorize only ever
    // redirects to 127.0.0.1, and `localhost` may resolve to ::1 first.
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        rejectListening(new Error('Could not open a local port for the login callback.'));
        return;
      }
      resolveListening({ server, port: address.port, result });
    });
  });
}

/** A recognisable label for the token list: the short hostname, without `.local`/`.localdomain`. */
export function deviceName(hostname = os.hostname()): string {
  return hostname.replace(/\.(local|localdomain|lan|home)$/i, '').split('.')[0] || 'unknown device';
}

function openBrowser(url: string): void {
  if (process.env.DECAP_NO_BROWSER) return;
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '""', url]]
      : ['xdg-open', [url]];
  try {
    spawn(command, args, { stdio: 'ignore', detached: true }).on('error', ignore).unref();
  } catch {
    // The URL is printed; opening it is a convenience.
  }
}
