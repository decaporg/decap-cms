import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Scope } from 'decap-turbo-api';

export const DEFAULT_API_URL = 'https://turbo.decapcms.org';

export interface Credentials {
  apiUrl: string;
  token: string;
  tokenId: string;
  scope: Scope;
  expiresAt: string | null;
  email: string | null;
}

/**
 * Where the token lives: `$XDG_CONFIG_HOME/decap/credentials.json`,
 * mode 0600 inside a 0700 directory. The plan calls for the OS keychain with
 * this file as the fallback; the keychain needs a native module, so phase 0
 * ships the fallback only.
 */
export function credentialsPath(): string {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'decap', 'credentials.json');
}

export function readCredentials(): Credentials | null {
  try {
    return JSON.parse(fs.readFileSync(credentialsPath(), 'utf8')) as Credentials;
  } catch {
    return null;
  }
}

export function writeCredentials(credentials: Credentials): void {
  const file = credentialsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, JSON.stringify(credentials, null, 2) + '\n', { mode: 0o600 });
  // writeFileSync only applies `mode` when creating; tighten an existing file too.
  fs.chmodSync(file, 0o600);
}

export function deleteCredentials(): boolean {
  try {
    fs.unlinkSync(credentialsPath());
    return true;
  } catch {
    return false;
  }
}

/**
 * The API base and token to use. Environment variables win, so CI can run
 * with `DECAP_TOKEN` and no credentials file at all.
 */
export function resolveAuth(flags: { apiUrl?: string } = {}): {
  apiUrl: string;
  token: string | null;
  stored: Credentials | null;
} {
  const stored = readCredentials();
  const apiUrl = (
    flags.apiUrl ||
    process.env.DECAP_API_URL ||
    stored?.apiUrl ||
    DEFAULT_API_URL
  ).replace(/\/+$/, '');
  const envToken = process.env.DECAP_TOKEN || null;
  // A stored token only counts for the API it was issued by.
  const token = envToken ?? (stored && stored.apiUrl === apiUrl ? stored.token : null);
  return { apiUrl, token, stored };
}
