/**
 * The fetch a Turbo backend uses for its proxy: carries the Supabase bearer
 * token, scopes the request to the site, refreshes a refused token once, and
 * feeds the save meter.
 */
import { APIError } from 'decap-cms-lib-util';

import { coalesceKey, type RequestCoalescer } from './requestCoalescer';
import { recordProxyResponse, type ProxyMeter } from './saveMetrics';

import type { TurboSession } from './session';

export type ScopedFetch = (url: string, init?: RequestInit, isRetry?: boolean) => Promise<Response>;

export interface ScopedFetchOptions {
  /** What every URL of this backend's proxy contains, e.g. `/functions/v1/gh`. */
  proxyMarker: string;
  session: TurboSession;
  /** The bearer token to send; the backend's own token is the fallback. */
  getToken: () => string;
  /** Shared with the git host's API client, so both read paths join the same in-flight requests. */
  coalesce: RequestCoalescer;
  /** Non-null only while a save is in flight; see `meterSave`. */
  getMeter: () => ProxyMeter | null;
}

/** The proxy's reason is in `error`, the git host's in `message`; show the sentence. */
export function proxyErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.error === 'string') return parsed.error;
    if (typeof parsed?.message === 'string') return parsed.message;
  } catch {
    // Not JSON: the body is already the message.
  }
  return body;
}

/**
 * Reads a response's body without consuming it for whoever parses it next.
 * lib-util's requestWithBackoff has already read every 403 body and left only
 * `json()` answering, and `clone()` throws on a used body, so that case reads
 * the cached JSON instead.
 */
export async function peekBody(response: Response): Promise<string> {
  try {
    if (response.bodyUsed) {
      const json = await response.json();
      return typeof json === 'string' ? json : JSON.stringify(json);
    }
    if (typeof response.clone !== 'function') return '';
    return await response.clone().text();
  } catch {
    return '';
  }
}

/**
 * Makes a failed proxy response read as its `error` sentence wherever the git
 * host's API client parses it; lib-util's parseResponse only looks for `message`.
 */
export function exposeProxyError(response: Response, body: string): Response {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(body);
  } catch {
    return response;
  }
  if (typeof parsed?.error !== 'string' || parsed.message) return response;
  const sentence = parsed.error;
  response.json = () => Promise.resolve({ ...parsed, message: sentence });
  response.text = () => Promise.resolve(sentence);
  return response;
}

/**
 * What an API request gets once the session is over. A response rather than a
 * throw: lib-util's requestWithBackoff retries any throw five times (~55 s),
 * while a 401 goes straight to the parser.
 */
export function sessionEndedResponse(message: string): Response {
  const response = {
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(message),
    clone: () => response,
  };
  return response as unknown as Response;
}

export function createScopedFetch(options: ScopedFetchOptions): ScopedFetch {
  const { proxyMarker, session, getToken, coalesce, getMeter } = options;

  async function scopedFetch(
    url: string,
    init: RequestInit = {},
    isRetry = false,
  ): Promise<Response> {
    session.assertUsable();
    await session.refreshIfNeeded();
    const accessToken = getToken();
    const headers: Record<string, string> = Object.fromEntries(
      new Headers(init.headers || {}).entries(),
    );

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let scopedUrl = url;
    const isProxyRequest = scopedUrl.includes(proxyMarker);
    if (session.siteId && isProxyRequest) {
      headers['x-site-id'] = session.siteId;
      const urlObj = new URL(scopedUrl);
      if (!urlObj.searchParams.has('site_id')) {
        urlObj.searchParams.set('site_id', session.siteId);
      }
      scopedUrl = urlObj.toString();
    }

    const response = await coalesce(coalesceKey(init.method, scopedUrl), () =>
      fetch(scopedUrl, { ...init, headers }).then(res => {
        // Before the ok-check: a failed request still cost the editor the wait.
        recordProxyResponse(getMeter(), res);
        return res;
      }),
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (isProxyRequest) {
        const verdict = await session.reactToProxyAuthAnswer(response.status, body, isRetry);
        if (verdict === 'retry') return scopedFetch(url, init, true);
      }
      throw new APIError(
        proxyErrorMessage(body) || response.statusText,
        response.status,
        'Decap Turbo',
      );
    }

    return response;
  }

  return scopedFetch;
}
