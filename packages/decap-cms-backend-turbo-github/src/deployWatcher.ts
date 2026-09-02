/**
 * Browser transport for deploy notifications — the read side of §A2's
 * `site_deployments`. See decap-turbo/docs/deploy-status-plan.md §A3.
 *
 * The CMS talks to PostgREST with raw `fetch` (see supabase.ts): there is no
 * `supabase-js` in this bundle and therefore no realtime channel. So v1 polls,
 * and the polling lives behind a `DeployTransport` so that swapping in
 * Realtime later replaces one object rather than rewriting the lifecycle
 * rules — the grace window, the ceiling and the terminal-state handling below
 * are transport-independent and are the part that is easy to get wrong.
 *
 * Nothing here renders anything. The watcher's only output is a sequence of
 * updates; turning those into a toast is §A4.
 */

/** Mirrors the `site_deployments_state_check` constraint. */
export type DeployState = 'pending' | 'building' | 'success' | 'failed' | 'canceled';

const TERMINAL_STATES: ReadonlySet<string> = new Set(['success', 'failed', 'canceled']);

export interface DeploymentRow {
  commit_sha: string;
  source: string;
  external_id: string;
  /** Null when the host could not be identified — the toast then says "your
   *  site" rather than naming a guess. */
  provider_label: string | null;
  state: DeployState;
  target_url: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
}

/**
 * Terminal `absent` and `timeout` are not deploy states — they are the two
 * ways this can end without one, and both mean "stop promising the editor
 * anything". `absent` is a site with no deploy hook at all; `timeout` is a
 * deploy that started and never reported back.
 */
export type DeployWatchStatus = DeployState | 'absent' | 'timeout';

export interface DeployWatchUpdate {
  status: DeployWatchStatus;
  /** The row the status was derived from; null for `absent`. */
  deployment: DeploymentRow | null;
  /** Echoed back so a late update from a superseded save is trivial to drop. */
  commitSha: string;
  /** Echoed back so the toast can name the entry that was saved. */
  entryPath?: string;
}

export interface DeployTransport {
  /**
   * Starts delivering every deployment row known for `commitSha`, as often as
   * it learns anything, until the returned stop function is called.
   *
   * `onRows` receives the full set each time rather than a delta: the watcher
   * has to pick between concurrent deploys anyway, so a complete picture is
   * both simpler and what a polling read naturally produces.
   */
  start(
    commitSha: string,
    onRows: (rows: DeploymentRow[]) => void,
    onError: (error: unknown) => void,
  ): () => void;
}

/** Fast enough that "live" feels immediate, slow enough to be free. */
export const POLL_INTERVAL_MS = 5000;

/**
 * How long a commit may produce no deployment row at all before we conclude
 * the site has no deploy hook and stop.
 *
 * Not optional, and this is the number that makes it safe to ship: most Decap
 * sites will never produce a row (see §A0 — Netlify does not report branch
 * deploys to GitHub), and a watcher without this would leave every one of them
 * with a toast spinning forever. Measured against real deliveries in §A2:
 * GitHub took ~7s from status to row, so this is a little under three times
 * the observed latency.
 */
export const ABSENT_AFTER_MS = 20000;

/** A deploy still running after this has, for the editor's purposes, hung. */
export const MAX_WATCH_MS = 15 * 60 * 1000;

/**
 * Consecutive transport failures tolerated before giving up. A poll crossing a
 * token refresh, or a laptop lid closing, must not end the watch; a genuinely
 * broken connection must not be retried for fifteen minutes.
 */
export const MAX_CONSECUTIVE_ERRORS = 3;

interface Clock {
  setTimeout: (handler: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

const REAL_CLOCK: Clock = {
  setTimeout: (handler, ms) => setTimeout(handler, ms),
  clearTimeout: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Picks the one deployment that answers "is my change live?" when a commit
 * produced several — a monorepo publishing twice, or a preview and a
 * production host both reporting.
 *
 * Order is success > running > failed > canceled, which is a claim about what
 * the editor needs rather than about recency:
 *
 * - A success outranks a sibling's failure because the change IS live
 *   somewhere, and saying "failed" would send the editor to debug a build that
 *   is not the one serving their site.
 * - A still-running deploy outranks an already-failed one for the same reason
 *   in reverse: it may yet succeed, and "failed" is not recoverable from once
 *   shown.
 *
 * Within a rank: first success wins (§A5's fallback, until target_url can be
 * matched against the site's configured URL), and most recently updated wins
 * for everything else.
 */
export function pickDeployment(rows: DeploymentRow[]): DeploymentRow | null {
  if (!rows || rows.length === 0) {
    return null;
  }

  function byState(...states: DeployState[]) {
    return rows.filter(row => states.includes(row.state));
  }

  const succeeded = byState('success');
  if (succeeded.length > 0) {
    return succeeded.reduce((first, row) =>
      finishedTime(row) < finishedTime(first) ? row : first,
    );
  }

  for (const candidates of [
    byState('pending', 'building'),
    byState('failed'),
    byState('canceled'),
  ]) {
    if (candidates.length > 0) {
      return candidates.reduce((latest, row) =>
        updatedTime(row) > updatedTime(latest) ? row : latest,
      );
    }
  }

  return null;
}

/** Unparseable or absent timestamps sort last rather than throwing. */
function finishedTime(row: DeploymentRow) {
  const parsed = Date.parse(row.finished_at || row.updated_at || '');
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function updatedTime(row: DeploymentRow) {
  const parsed = Date.parse(row.updated_at || '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * True when two rows would produce the same toast. `updated_at` is deliberately
 * not compared: a host that re-reports the same state should not make the
 * notification flicker.
 */
function isSameUpdate(a: DeploymentRow | null, b: DeploymentRow | null) {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    a.source === b.source &&
    a.external_id === b.external_id &&
    a.state === b.state &&
    a.target_url === b.target_url &&
    a.provider_label === b.provider_label &&
    a.error_message === b.error_message
  );
}

/**
 * Polling transport (v1). Zero new bundle weight and works through the same
 * PostgREST access the content cache already uses.
 *
 * The next poll is scheduled when the previous one settles, not on a fixed
 * interval, so a slow or hanging request cannot stack up behind itself.
 */
export function createPollingTransport(
  fetchRows: (commitSha: string) => Promise<DeploymentRow[]>,
  options: { intervalMs?: number; clock?: Clock } = {},
): DeployTransport {
  const intervalMs = options.intervalMs ?? POLL_INTERVAL_MS;
  const clock = options.clock ?? REAL_CLOCK;

  return {
    start(commitSha, onRows, onError) {
      let stopped = false;
      let timer: unknown = null;

      async function poll() {
        try {
          const rows = await fetchRows(commitSha);
          if (!stopped) {
            onRows(rows);
          }
        } catch (error) {
          if (!stopped) {
            onError(error);
          }
        }
        // Re-checked after the await: the watcher may have stopped us from
        // inside onRows, and scheduling here would poll a dead watch forever.
        if (!stopped) {
          timer = clock.setTimeout(poll, intervalMs);
        }
      }

      // Immediately, not after one interval: by the time a save returns, the
      // webhook may already have landed, and this is the cheapest way to find
      // out. It also starts the absent-window clock honestly.
      poll();

      return () => {
        stopped = true;
        if (timer !== null) {
          clock.clearTimeout(timer);
          timer = null;
        }
      };
    },
  };
}

export interface DeployWatchOptions {
  entryPath?: string;
}

/**
 * Watches one commit at a time and reports what happened to it.
 *
 * One at a time is the design, not a limitation: §A4 shows a single updating
 * toast, so a second save supersedes the first — the editor cares about the
 * change they just made, and two competing "your change is live" toasts would
 * be worse than one.
 */
export class DeployWatcher {
  private transport: DeployTransport;
  private clock: Clock;
  private absentAfterMs: number;
  private maxWatchMs: number;
  private stopTransport: (() => void) | null = null;
  private graceTimer: unknown = null;
  private ceilingTimer: unknown = null;
  private listener: ((update: DeployWatchUpdate) => void) | null = null;
  private commitSha = '';
  private entryPath?: string;
  private lastEmitted: DeploymentRow | null = null;
  private sawAnyRow = false;
  private consecutiveErrors = 0;
  /**
   * Bumped per watch, so the stop function handed to a caller only ever stops
   * the watch it came from. Without this, a component holding the handle from
   * save #1 would tear down save #2's watch when it unmounted.
   */
  private generation = 0;

  constructor(
    transport: DeployTransport,
    options: { clock?: Clock; absentAfterMs?: number; maxWatchMs?: number } = {},
  ) {
    this.transport = transport;
    this.clock = options.clock ?? REAL_CLOCK;
    this.absentAfterMs = options.absentAfterMs ?? ABSENT_AFTER_MS;
    this.maxWatchMs = options.maxWatchMs ?? MAX_WATCH_MS;
  }

  /**
   * Starts watching `commitSha`, superseding any watch already running.
   * Returns a stop function; the watcher also stops itself on any terminal
   * update, so a caller that only wants the notification need not hold it.
   */
  watch(
    commitSha: string,
    listener: (update: DeployWatchUpdate) => void,
    options: DeployWatchOptions = {},
  ): () => void {
    this.stop();

    this.generation += 1;
    const generation = this.generation;
    this.commitSha = commitSha;
    this.entryPath = options.entryPath;
    this.listener = listener;
    this.lastEmitted = null;
    this.sawAnyRow = false;
    this.consecutiveErrors = 0;

    this.graceTimer = this.clock.setTimeout(() => {
      this.graceTimer = null;
      // Only meaningful while nothing has ever arrived; once a row exists the
      // ceiling below is what bounds the watch.
      if (!this.sawAnyRow) {
        this.finish({ status: 'absent', deployment: null });
      }
    }, this.absentAfterMs);

    this.ceilingTimer = this.clock.setTimeout(() => {
      this.ceilingTimer = null;
      this.finish({ status: 'timeout', deployment: this.lastEmitted });
    }, this.maxWatchMs);

    this.stopTransport = this.transport.start(
      commitSha,
      rows => this.onRows(rows),
      error => this.onError(error),
    );

    return () => {
      if (this.generation === generation) {
        this.stop();
      }
    };
  }

  /** Stops without emitting — for teardown and for being superseded. */
  stop(): void {
    if (this.stopTransport) {
      this.stopTransport();
      this.stopTransport = null;
    }
    if (this.graceTimer !== null) {
      this.clock.clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    if (this.ceilingTimer !== null) {
      this.clock.clearTimeout(this.ceilingTimer);
      this.ceilingTimer = null;
    }
    this.listener = null;
  }

  private onRows(rows: DeploymentRow[]) {
    this.consecutiveErrors = 0;

    const deployment = pickDeployment(rows);
    if (!deployment) {
      // An empty read is the ordinary case for the first few seconds; the
      // grace timer, not this, decides when to give up.
      return;
    }

    this.sawAnyRow = true;
    if (this.graceTimer !== null) {
      this.clock.clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }

    if (isSameUpdate(this.lastEmitted, deployment)) {
      return;
    }
    this.lastEmitted = deployment;

    const update: DeployWatchUpdate = { status: deployment.state, deployment, ...this.context() };

    if (TERMINAL_STATES.has(deployment.state)) {
      this.finish(update);
    } else {
      this.emit(update);
    }
  }

  private onError(error: unknown) {
    this.consecutiveErrors += 1;
    if (this.consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
      return;
    }
    // We have learned nothing about this deploy, so degrade exactly as a site
    // with no deploy hook does rather than inventing a failure the editor
    // would go looking for.
    console.warn('Deploy watch giving up after repeated failures', error);
    this.finish({ status: 'absent', deployment: null });
  }

  private context() {
    return { commitSha: this.commitSha, ...(this.entryPath && { entryPath: this.entryPath }) };
  }

  private emit(update: DeployWatchUpdate) {
    this.listener?.(update);
  }

  /** Emits a last update and tears down, in that order. */
  private finish(update: Omit<DeployWatchUpdate, 'commitSha' | 'entryPath'>) {
    const listener = this.listener;
    const full = { ...update, ...this.context() } as DeployWatchUpdate;
    this.stop();
    listener?.(full);
  }
}

/** Columns the toast needs; `select=*` would ship the site_id and repo for nothing. */
const DEPLOYMENT_COLUMNS = [
  'commit_sha',
  'source',
  'external_id',
  'provider_label',
  'state',
  'target_url',
  'error_message',
  'started_at',
  'finished_at',
  'updated_at',
].join(',');

/**
 * More rows than any commit should produce, so a pathological repo cannot turn
 * a five-second poll into a large response.
 */
const DEPLOYMENT_LIMIT = 20;

export interface DeploymentFetcherConfig {
  /** Project root, e.g. `https://<ref>.supabase.co` — no trailing path. */
  baseUrl: string;
  anonKey: string;
  siteId: string;
  /**
   * Read per request, never captured: the access token is rotated by the
   * session refresh, and a watch outlives several of those.
   */
  getAccessToken: () => string | null | undefined;
  fetchImpl?: typeof fetch;
}

/**
 * Reads `site_deployments` through PostgREST.
 *
 * `site_id` is filtered here as well as by RLS. RLS already scopes this to the
 * site the JWT is active on, so the filter is not the security boundary — it
 * is what keeps a stale JWT (still scoped to the site the editor was on a
 * moment ago) from returning another site's rows for the same commit.
 */
export function createDeploymentFetcher(config: DeploymentFetcherConfig) {
  const doFetch = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  return async function fetchDeployments(commitSha: string): Promise<DeploymentRow[]> {
    const accessToken = config.getAccessToken();
    if (!accessToken) {
      // The anon key alone cannot satisfy the select policy, so a request now
      // would be a guaranteed empty read that looks like "no deploy".
      throw new Error('Deploy status requires a signed-in session');
    }

    const params = new URLSearchParams({
      select: DEPLOYMENT_COLUMNS,
      site_id: `eq.${config.siteId}`,
      commit_sha: `eq.${commitSha}`,
      order: 'updated_at.desc',
      limit: String(DEPLOYMENT_LIMIT),
    });

    const response = await doFetch(`${config.baseUrl}/rest/v1/site_deployments?${params}`, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Deploy status request failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as DeploymentRow[]) : [];
  };
}

/** Wires the polling transport to PostgREST — the whole v1 transport in one call. */
export function createDeployWatcher(
  config: DeploymentFetcherConfig & { intervalMs?: number; clock?: Clock },
): DeployWatcher {
  return new DeployWatcher(
    createPollingTransport(createDeploymentFetcher(config), {
      intervalMs: config.intervalMs,
      clock: config.clock,
    }),
    { clock: config.clock },
  );
}
