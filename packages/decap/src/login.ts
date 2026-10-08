import crypto from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';

import { ApiClient, ApiError, operations } from './api.js';
import { credentialsPath, deleteCredentials, readCredentials, writeCredentials } from './config.js';

import type { Credentials } from './config.js';
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
export async function login(options: {
  apiUrl: string;
  admin: boolean;
  /** Opens the approval page; tests stand in for the browser here. */
  openBrowser?: (url: string) => void;
}): Promise<void> {
  // The token this login replaces, read before anything can overwrite it.
  const previous = readCredentials();
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
  (options.openBrowser ?? openBrowser)(authorize.toString());

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

  // The file holds one token, so the one it held is unreachable from here on
  // but would stay valid for the rest of its 90 days. Revoked only now, so a
  // login that fails halfway leaves the user signed in as before.
  if (previous && previous.token !== issued.token) {
    const failure = await revokeStoredToken(previous);
    if (failure) warnNotRevoked(previous.apiUrl, failure, 'the token this login replaced');
  }
}

function warnNotRevoked(apiUrl: string, reason: string, which = 'the token'): void {
  console.error(
    `! Could not revoke ${which} on ${apiUrl}: ${reason}\n` +
      '  It may still be valid until it expires. Revoke it in Decap Turbo under Profile → API tokens.',
  );
}

/**
 * Revokes a stored token on the instance that issued it. Best effort: the
 * reason it failed, or null when it is revoked (or was already dead, a 401).
 */
export async function revokeStoredToken(stored: Credentials): Promise<string | null> {
  try {
    await new ApiClient(stored.apiUrl, stored.token).call(operations.revokeCurrentToken);
    return null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    return (err as Error).message ?? String(err);
  }
}

/**
 * `decap logout`: revoke the stored token, then forget it whatever the server
 * said. Keeping the file because the server was unreachable would leave the
 * user signed in with no way out but deleting it by hand; a token that could
 * not be revoked is reported instead, with where to revoke it.
 */
export async function logout(stored: Credentials | null): Promise<void> {
  const revokeFailure = stored ? await revokeStoredToken(stored) : null;
  if (!deleteCredentials()) {
    if (stored) throw new Error(`Could not remove ${credentialsPath()}.`);
    console.log('Not signed in.');
    return;
  }
  console.log(`Signed out. Removed ${credentialsPath()}.`);
  if (revokeFailure) warnNotRevoked(stored!.apiUrl, revokeFailure);
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

/**
 * The program that opens `url` in the default browser, and its arguments.
 * Never through a shell: on Windows `cmd /c start` reads the `&` between query
 * parameters as a command separator, which cut the authorize link off after
 * `port` and dropped the state and PKCE challenge. rundll32 takes the URL as
 * one argument and hands it to the registered protocol handler.
 */
export function browserCommand(
  url: string,
  platform: NodeJS.Platform = process.platform,
): [string, string[]] {
  if (platform === 'darwin') return ['open', [url]];
  if (platform === 'win32') return ['rundll32', ['url.dll,FileProtocolHandler', url]];
  return ['xdg-open', [url]];
}

function openBrowser(url: string): void {
  if (process.env.DECAP_NO_BROWSER) return;
  const [command, args] = browserCommand(url);
  try {
    spawn(command, args, { stdio: 'ignore', detached: true }).on('error', ignore).unref();
  } catch {
    // The URL is printed; opening it is a convenience.
  }
}
