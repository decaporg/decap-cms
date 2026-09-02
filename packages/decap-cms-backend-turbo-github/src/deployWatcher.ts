/**
 * Browser transport for deploy notifications — the read side of §A2's
 * `site_deployments`. See decap-turbo/docs/deploy-status-plan.md §A3/§A4b.
 *
 * The CMS talks to PostgREST with raw `fetch` (see supabase.ts): there is no
 * `supabase-js` in this bundle and therefore no realtime channel. So v1 polls,
 * behind a `DeployTransport` so that swapping in Realtime later replaces one
 * object rather than the lifecycle rules below.
 *
 * The question this answers is NOT "did my commit's deploy succeed" but
 * **"has a deploy that CONTAINS my commit succeeded"** — ancestry, not
 * identity. That reframing is what makes several saves, a build cancelled in
 * favour of a newer commit, and several editors all behave sensibly: a newer
 * deploy that swallowed my commit still means my change is live.
 *
 * Nothing here renders anything. Its output is a sequence of resolutions.
 */

/** Mirrors the `site_deployments_state_check` constraint. */
export type DeployState = 'pending' | 'building' | 'success' | 'failed' | 'canceled';

export interface DeploymentRow {
  commit_sha: string;
  source: string;
  external_id: string;
  /** Null when the host could not be identified — callers then say "your
   *  site" rather than naming a guess. */
  provider_label: string | null;
  state: DeployState;
  target_url: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
}

/** One save of one entry, waiting to be seen live. */
export interface PendingSave {
  entryPath: string;
  /** Human title for the notification; the path is the fallback. */
  entryLabel?: string;
  commitSha: string;
  /** Epoch ms, browser clock — used only for expiry and the query window. */
  savedAt: number;
  /** A failure has already been reported for this save. It stays in the
   *  ledger anyway: a later deploy may still carry the change live. */
  failureReported?: boolean;
}

export interface DeployResolution {
  status: 'live' | 'failed';
  /** Every pending save this deployment accounted for. */
  entries: Array<{ entryPath: string; entryLabel?: string }>;
  targetUrl: string | null;
  deployment: DeploymentRow;
}

export interface DeployTransport {
  /**
   * Starts delivering deployment rows for the watched branch, as often as it
   * learns anything, until the returned stop function is called.
   *
   * `sinceIso` is the earliest `updated_at` worth reading — everything older
   * predates every pending save. The callback receives the full set each
   * time rather than a delta: resolution has to weigh rows against each other
   * anyway, and a complete picture is what a polling read naturally produces.
   */
  start(
    getSince: () => string,
    onRows: (rows: DeploymentRow[]) => void,
    onError: (error: unknown) => void,
  ): () => void;
}

/**
 * How often to look, by how long the oldest pending save has been waiting.
 *
 * Flat 5s polling was fine when a watch lasted 20s. It is not fine now that a
 * watch outlives a real build: 5s for twenty minutes is 240 requests for one
 * save. This is ~54 for the same window, still quick where it matters — the
 * first minute, when most sites finish.
 */
export const POLL_STEPS: ReadonlyArray<{ untilMs: number; everyMs: number }> = [
  { untilMs: 60_000, everyMs: 5_000 },
  { untilMs: 180_000, everyMs: 15_000 },
  { untilMs: Number.POSITIVE_INFINITY, everyMs: 30_000 },
];

/**
 * If not one deployment row has appeared for the branch in this long, the site
 * has no deploy hook that reports to us (§A0 — the common case) and we stop.
 * Silently: the save was already confirmed by its own toast, and a site with
 * no CI must never be told anything about a deploy.
 */
export const FIRST_SIGN_TIMEOUT_MS = 120_000;

/** A save nobody ever reported on is forgotten this long after it was made. */
export const LEDGER_TTL_MS = 20 * 60_000;

/** Consecutive transport failures tolerated before giving up on the watch. */
export const MAX_CONSECUTIVE_ERRORS = 5;

/** Read window slack, for clock skew between this browser and the deploy host. */
const SINCE_SKEW_MS = 60_000;

interface Clock {
  setTimeout: (handler: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  now: () => number;
}

const REAL_CLOCK: Clock = {
  setTimeout: (handler, ms) => setTimeout(handler, ms),
  clearTimeout: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export function pollIntervalFor(waitedMs: number) {
  for (const step of POLL_STEPS) {
    if (waitedMs < step.untilMs) {
      return step.everyMs;
    }
  }
  return POLL_STEPS[POLL_STEPS.length - 1].everyMs;
}

/**
 * Where the ledger survives a page reload. A build outlasts a reload easily,
 * and an editor who reloads mid-build should still be told their change went
 * live.
 */
export interface LedgerStore {
  load(): PendingSave[];
  save(entries: PendingSave[]): void;
}

export function createMemoryLedger(): LedgerStore {
  let entries: PendingSave[] = [];
  return {
    load: () => entries,
    save: next => {
      entries = next;
    },
  };
}

/**
 * Falls back to memory when storage is unavailable (Safari private mode) or
 * unreadable. Losing a notification is a far smaller problem than a save path
 * that throws.
 */
export function createLocalStorageLedger(key: string): LedgerStore {
  const memory = createMemoryLedger();

  function storage() {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  }

  return {
    load() {
      const store = storage();
      if (!store) {
        return memory.load();
      }
      try {
        const raw = store.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? (parsed as PendingSave[]) : [];
      } catch {
        return [];
      }
    },
    save(entries) {
      const store = storage();
      if (!store) {
        memory.save(entries);
        return;
      }
      try {
        if (entries.length === 0) {
          store.removeItem(key);
        } else {
          store.setItem(key, JSON.stringify(entries));
        }
      } catch {
        memory.save(entries);
      }
    },
  };
}

/**
 * Polling transport (v1). Zero new bundle weight and works through the same
 * PostgREST access the content cache already uses.
 *
 * The next poll is scheduled when the previous one settles, not on a fixed
 * interval, so a slow or hanging request cannot stack up behind itself.
 */
export function createPollingTransport(
  fetchRows: (sinceIso: string) => Promise<DeploymentRow[]>,
  options: { intervalMs: () => number; clock?: Clock },
): DeployTransport {
  const clock = options.clock ?? REAL_CLOCK;

  return {
    start(getSince, onRows, onError) {
      let stopped = false;
      let timer: unknown = null;

      async function poll() {
        try {
          const rows = await fetchRows(getSince());
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
          timer = clock.setTimeout(poll, options.intervalMs());
        }
      }

      // Immediately, not after one interval: by the time a save returns the
      // deploy may already have been reported, and this is the cheapest way
      // to find out.
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

export interface DeployWatcherDeps {
  transport: DeployTransport;
  /**
   * Whether `head` contains `base` — GitHub's compare, `ahead` or `identical`.
   * Only consulted when a successful deploy names a commit that is not one of
   * ours, which is exactly the cancelled-in-favour-of-newer case.
   */
  isCommitContained: (base: string, head: string) => Promise<boolean>;
  ledger?: LedgerStore;
  clock?: Clock;
}

/**
 * Tracks this editor's saves until a deploy accounts for them.
 *
 * One watcher per site, holding many saves — not one watch per save. Keyed by
 * entry path with the newest commit winning, so re-saving an entry moves the
 * ledger forward rather than leaving an older version to be announced as live.
 */
export class DeployWatcher {
  private transport: DeployTransport;
  private isCommitContained: DeployWatcherDeps['isCommitContained'];
  private ledger: LedgerStore;
  private clock: Clock;
  private stopTransport: (() => void) | null = null;
  private listeners = new Set<(resolution: DeployResolution) => void>();
  private pending: PendingSave[] = [];
  private sawAnyRow = false;
  private startedAt = 0;
  private consecutiveErrors = 0;
  private resolving = false;
  /** Memoises compare answers; a deploy is weighed against the same saves on
   *  every poll until it resolves them. */
  private ancestry = new Map<string, boolean>();

  constructor(deps: DeployWatcherDeps) {
    this.transport = deps.transport;
    this.isCommitContained = deps.isCommitContained;
    this.ledger = deps.ledger ?? createMemoryLedger();
    this.clock = deps.clock ?? REAL_CLOCK;
    this.pending = this.prune(this.ledger.load());
  }

  /**
   * Attaches a listener and resumes any ledger left over from a previous page
   * load. Returns an unsubscribe function.
   */
  subscribe(listener: (resolution: DeployResolution) => void): () => void {
    this.listeners.add(listener);
    if (this.pending.length > 0) {
      this.ensureRunning();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Records a save and starts (or keeps) watching for the deploy that carries it. */
  record(save: { entryPath: string; entryLabel?: string; commitSha: string }): void {
    const now = this.clock.now();
    // Newest commit per path wins: announcing an older version as live when a
    // newer one is still building would be worse than saying nothing.
    this.pending = [
      ...this.prune(this.pending).filter(entry => entry.entryPath !== save.entryPath),
      { ...save, savedAt: now },
    ];
    this.persist();
    this.ensureRunning();
  }

  /** True while any save is still waiting to be accounted for. */
  get isWatching() {
    return this.stopTransport !== null;
  }

  stop(): void {
    if (this.stopTransport) {
      this.stopTransport();
      this.stopTransport = null;
    }
    this.sawAnyRow = false;
    this.consecutiveErrors = 0;
    this.ancestry.clear();
  }

  private prune(entries: PendingSave[]) {
    const now = this.clock.now();
    return entries.filter(entry => now - entry.savedAt < LEDGER_TTL_MS);
  }

  private persist() {
    this.ledger.save(this.pending);
  }

  private ensureRunning() {
    if (this.stopTransport || this.pending.length === 0) {
      return;
    }
    this.startedAt = this.clock.now();
    this.stopTransport = this.transport.start(
      () => this.since(),
      rows => {
        this.onRows(rows);
      },
      error => this.onError(error),
    );
  }

  /** Nothing updated before the oldest pending save can concern it. */
  private since() {
    const oldest = this.pending.reduce(
      (min, entry) => Math.min(min, entry.savedAt),
      this.clock.now(),
    );
    return new Date(oldest - SINCE_SKEW_MS).toISOString();
  }

  private waited() {
    const oldest = this.pending.reduce(
      (min, entry) => Math.min(min, entry.savedAt),
      this.clock.now(),
    );
    return this.clock.now() - oldest;
  }

  /** Interval for the next poll — read by the transport, so backoff is one number. */
  intervalMs() {
    return pollIntervalFor(this.waited());
  }

  private onRows(rows: DeploymentRow[]) {
    this.consecutiveErrors = 0;

    if (rows.length > 0) {
      this.sawAnyRow = true;
    }

    this.pending = this.prune(this.pending);
    this.persist();

    if (this.pending.length === 0) {
      this.stop();
      return;
    }

    if (!this.sawAnyRow && this.clock.now() - this.startedAt > FIRST_SIGN_TIMEOUT_MS) {
      // No deploy hook reports to us for this site. Stop, and say nothing:
      // the save has already been confirmed on its own.
      this.pending = [];
      this.persist();
      this.stop();
      return;
    }

    // Resolution can await a compare call, so a slow round must not be
    // re-entered by the next poll and emit the same resolution twice.
    if (this.resolving) {
      return;
    }
    this.resolving = true;
    this.resolve(rows).finally(() => {
      this.resolving = false;
    });
  }

  private async resolve(rows: DeploymentRow[]) {
    function byOldest(a: DeploymentRow, b: DeploymentRow) {
      return Date.parse(a.updated_at) - Date.parse(b.updated_at);
    }

    // Successes first: a save that failed once and then shipped should be
    // reported as live, never re-reported as failed.
    for (const row of [...rows].filter(r => r.state === 'success').sort(byOldest)) {
      const contained = await this.containedIn(row);
      if (contained.length === 0) {
        continue;
      }
      const paths = new Set(contained.map(entry => entry.entryPath));
      this.pending = this.pending.filter(entry => !paths.has(entry.entryPath));
      this.persist();
      this.emit({
        status: 'live',
        entries: contained.map(({ entryPath, entryLabel }) => ({ entryPath, entryLabel })),
        targetUrl: row.target_url,
        deployment: row,
      });
    }

    for (const row of [...rows].filter(r => r.state === 'failed').sort(byOldest)) {
      const contained = (await this.containedIn(row)).filter(entry => !entry.failureReported);
      if (contained.length === 0) {
        continue;
      }
      // Reported, but kept: a later deploy may still carry these changes live,
      // and the editor should hear about that too.
      const paths = new Set(contained.map(entry => entry.entryPath));
      this.pending = this.pending.map(entry =>
        paths.has(entry.entryPath) ? { ...entry, failureReported: true } : entry,
      );
      this.persist();
      this.emit({
        status: 'failed',
        entries: contained.map(({ entryPath, entryLabel }) => ({ entryPath, entryLabel })),
        targetUrl: row.target_url,
        deployment: row,
      });
    }

    // `canceled`, `pending` and `building` resolve nothing — deliberately.
    // A build cancelled in favour of a newer commit has not lost the change;
    // it is shipping inside that newer deploy, and the ledger waits for it.
    if (this.pending.length === 0) {
      this.stop();
    }
  }

  /** The pending saves this deployment can be said to carry. */
  private async containedIn(row: DeploymentRow) {
    const contained: PendingSave[] = [];

    for (const entry of this.pending) {
      if (entry.commitSha === row.commit_sha) {
        contained.push(entry);
        continue;
      }

      const key = `${entry.commitSha}..${row.commit_sha}`;
      if (this.ancestry.has(key)) {
        if (this.ancestry.get(key)) {
          contained.push(entry);
        }
        continue;
      }

      try {
        const isContained = await this.isCommitContained(entry.commitSha, row.commit_sha);
        this.ancestry.set(key, isContained);
        if (isContained) {
          contained.push(entry);
        }
      } catch (error) {
        // Deliberately no fallback guess. "Your change is live" is the one
        // claim this feature exists to make trustworthy, and a timestamp
        // comparison across two clocks is not evidence for it. Leave the save
        // pending and ask again next poll; if it never answers, the entry
        // expires and nothing is claimed.
        console.warn('Deploy ancestry check failed, leaving the save pending', error);
      }
    }

    return contained;
  }

  private onError(error: unknown) {
    this.consecutiveErrors += 1;
    if (this.consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
      return;
    }
    // Nothing has been learned about these deploys, so say nothing about them.
    // The ledger survives in storage, so the next page load resumes the watch.
    console.warn('Deploy watch giving up after repeated failures', error);
    this.stop();
  }

  private emit(resolution: DeployResolution) {
    for (const listener of [...this.listeners]) {
      listener(resolution);
    }
  }
}

/** Columns the notification needs; `select=*` would ship site_id and repo for nothing. */
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

/** More rows than any window should hold, so one read cannot become large. */
const DEPLOYMENT_LIMIT = 20;

export interface DeploymentFetcherConfig {
  /** Project root, e.g. `https://<ref>.supabase.co` — no trailing path. */
  baseUrl: string;
  anonKey: string;
  siteId: string;
  branch: string;
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
 * Filtered by branch rather than by commit: the deploy that carries a change
 * live is not always the deploy of that commit, so the read has to see its
 * neighbours too.
 *
 * `site_id` is filtered here as well as by RLS. RLS already scopes this to the
 * site the JWT is active on, so the filter is not the security boundary — it
 * is what keeps a stale JWT (still scoped to the site the editor was on a
 * moment ago) from returning another site's rows.
 */
export function createDeploymentFetcher(config: DeploymentFetcherConfig) {
  const doFetch = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  return async function fetchDeployments(sinceIso: string): Promise<DeploymentRow[]> {
    const accessToken = config.getAccessToken();
    if (!accessToken) {
      // The anon key alone cannot satisfy the select policy, so a request now
      // would be a guaranteed empty read that looks like "no deploy".
      throw new Error('Deploy status requires a signed-in session');
    }

    const params = new URLSearchParams({
      select: DEPLOYMENT_COLUMNS,
      site_id: `eq.${config.siteId}`,
      branch: `eq.${config.branch}`,
      updated_at: `gte.${sinceIso}`,
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
  config: DeploymentFetcherConfig & {
    isCommitContained: DeployWatcherDeps['isCommitContained'];
    ledger?: LedgerStore;
    clock?: Clock;
  },
): DeployWatcher {
  // The transport asks the watcher for the next interval and the watcher owns
  // the transport, so one of the two references has to be late-bound. A holder
  // keeps that explicit rather than relying on a `let` the linter mistrusts.
  const holder: { watcher: DeployWatcher | null } = { watcher: null };

  const transport = createPollingTransport(createDeploymentFetcher(config), {
    intervalMs: () => holder.watcher?.intervalMs() ?? POLL_STEPS[0].everyMs,
    clock: config.clock,
  });

  holder.watcher = new DeployWatcher({
    transport,
    isCommitContained: config.isCommitContained,
    ledger: config.ledger ?? createLocalStorageLedger(`decap-turbo:deploys:${config.siteId}`),
    clock: config.clock,
  });

  return holder.watcher;
}
