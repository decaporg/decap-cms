/**
 * Browser side of deploy notifications, reading `site_deployments`. It polls
 * raw PostgREST (no `supabase-js` in this bundle, so no Realtime), behind a
 * `DeployTransport` so Realtime could later replace that one object.
 *
 * The question is NOT "did my commit's deploy succeed" but "has a deploy that
 * CONTAINS my commit succeeded": ancestry, not identity, so a newer deploy that
 * swallowed my commit still means my change is live.
 */

/** Mirrors the `site_deployments_state_check` constraint. */
export type DeployState = 'pending' | 'building' | 'success' | 'failed' | 'canceled';

/** One CMS save, as `site_commits` records it. */
export interface CommitRow {
  commit_sha: string;
  branch: string;
  entry_label: string | null;
  entry_path: string | null;
  message: string | null;
  created_at: string;
}

export interface DeploymentRow {
  commit_sha: string;
  /** The branch that was BUILT — the site's, or an editorial-workflow one. */
  branch?: string | null;
  source: string;
  external_id: string;
  /** Null when the host is unknown; callers say "your site", not a guess. */
  provider_label: string | null;
  state: DeployState;
  target_url: string | null;
  error_message: string | null;
  /** Where it published to, in the host's words: "production", "deploy-preview". */
  environment?: string | null;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
}

/**
 * Identity of one pending save. A path alone cannot tell a save from the
 * re-save that replaced it while resolution was awaiting.
 */
function saveKey(save: { entryPath: string; commitSha: string }): string {
  return `${save.entryPath}@${save.commitSha}`;
}

/** One save of one entry, waiting to be seen live. */
export interface PendingSave {
  entryPath: string;
  /** Human title for the notification; the path is the fallback. */
  entryLabel?: string;
  /**
   * Where this entry lives on the built site, e.g. `/blog/my-post/`: a path,
   * so it joins whichever deploy's host carries the change.
   */
  entryUrlPath?: string;
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
  entries: Array<{ entryPath: string; entryLabel?: string; entryUrlPath?: string }>;
  targetUrl: string | null;
  deployment: DeploymentRow;
}

/**
 * What the header pill renders: a condition ("two changes are still
 * publishing"), where a `DeployResolution` is an event for a toast.
 */
export interface WatchStatus {
  /** Saves this browser has made that no deploy has accounted for yet. */
  pendingCount: number;
  /** Most recently updated deployment this watcher has seen, in any state. */
  latest: DeploymentRow | null;
}

export interface DeployTransport {
  /**
   * Delivers the watched branch's rows, the full set each time, until stopped.
   * `getSince` is the earliest `updated_at` worth reading.
   */
  start(
    getSince: () => string,
    onRows: (rows: DeploymentRow[]) => void,
    onError: (error: unknown) => void,
  ): () => void;
}

/**
 * Whether an editor sees any of this, and which host's success counts as
 * "live". `deploy_status: false` turns it off; an object turns parts off. On
 * by default: the surfaces hide themselves until a deploy is reported.
 */
export interface DeployStatusOptions {
  enabled: boolean;
  /** The toasts — "your change is live". */
  notifications: boolean;
  /** The /deploys route and its nav item. */
  page: boolean;
  /**
   * `provider_label` whose success means live, for a site on several hosts.
   * Null lets the first success win, which is why the toast names the host.
   */
  primaryTarget: string | null;
}

/** The parsed options plus the site's branch, so "Live" ignores other branches' builds. */
export type DeployStatusConfig = DeployStatusOptions & { branch: string | null };

export const DEFAULT_DEPLOY_STATUS_OPTIONS: DeployStatusOptions = {
  enabled: true,
  notifications: true,
  page: true,
  primaryTarget: null,
};

export function parseDeployStatusOptions(raw: unknown): DeployStatusOptions {
  if (raw === false) {
    return { enabled: false, notifications: false, page: false, primaryTarget: null };
  }

  if (raw === undefined || raw === null || raw === true) {
    return DEFAULT_DEPLOY_STATUS_OPTIONS;
  }

  if (typeof raw !== 'object') {
    return DEFAULT_DEPLOY_STATUS_OPTIONS;
  }

  const options = raw as Record<string, unknown>;
  const enabled = options.enabled !== false;
  const primaryTarget =
    typeof options.primary_target === 'string' && options.primary_target.trim()
      ? options.primary_target.trim()
      : null;

  return {
    enabled,
    // A disabled feature disables both surfaces, whatever the sub-keys say.
    notifications: enabled && options.notifications !== false,
    page: enabled && options.page !== false,
    primaryTarget,
  };
}

/**
 * How often to look, by how long the oldest pending save has been waiting:
 * quick in the first minute, when most sites finish, then backing off.
 */
export const POLL_STEPS: ReadonlyArray<{ untilMs: number; everyMs: number }> = [
  { untilMs: 60_000, everyMs: 5_000 },
  { untilMs: 180_000, everyMs: 15_000 },
  { untilMs: Number.POSITIVE_INFINITY, everyMs: 30_000 },
];

/**
 * No deployment row for the branch in this long means no deploy hook reports
 * to us, so stop, silently: the save was already confirmed.
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

/** Survives a reload, so an editor who reloads mid-build still hears about it. */
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

/** Falls back to memory when storage is unavailable; a lost notification beats a throw. */
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
 * Polling transport. The next poll is scheduled when the previous one settles,
 * so a slow or hanging request cannot stack up behind itself.
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

      // Immediately: the deploy may already have been reported.
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
  /** Whether `head` contains `base`; asked when a success names a commit not ours. */
  isCommitContained: (base: string, head: string) => Promise<boolean>;
  /** Only this branch's deploys are the site's state; null lets every row count. */
  siteBranch?: string | null;
  ledger?: LedgerStore;
  clock?: Clock;
}

/**
 * Tracks this editor's saves until a deploy accounts for them: one watcher per
 * site, keyed by entry path with the newest commit winning.
 */
export class DeployWatcher {
  private transport: DeployTransport;
  private isCommitContained: DeployWatcherDeps['isCommitContained'];
  private siteBranch: string | null;
  private ledger: LedgerStore;
  private clock: Clock;
  private stopTransport: (() => void) | null = null;
  private listeners = new Set<(resolution: DeployResolution) => void>();
  private statusListeners = new Set<(status: WatchStatus) => void>();
  private pending: PendingSave[] = [];
  private sawAnyRow = false;
  private latestRow: DeploymentRow | null = null;
  private startedAt = 0;
  private consecutiveErrors = 0;
  private resolving = false;
  /** Memoises compare answers; a deploy is weighed against the same saves on
   *  every poll until it resolves them. */
  private ancestry = new Map<string, boolean>();

  constructor(deps: DeployWatcherDeps) {
    this.transport = deps.transport;
    this.isCommitContained = deps.isCommitContained;
    this.siteBranch = deps.siteBranch ?? null;
    this.ledger = deps.ledger ?? createMemoryLedger();
    this.clock = deps.clock ?? REAL_CLOCK;
    this.pending = this.prune(this.ledger.load());
  }

  /** Attaches a listener and resumes any ledger left from a previous load. */
  subscribe(listener: (resolution: DeployResolution) => void): () => void {
    this.listeners.add(listener);
    if (this.pending.length > 0) {
      this.ensureRunning();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        // Nothing left to report to, so nothing to poll for. The ledger stays
        // in storage, so a later subscribe picks the watch back up.
        this.stop();
      }
    };
  }

  /**
   * Attaches a status listener. Unlike `subscribe`, this never starts a poll,
   * or an idle CMS would poll forever to keep a badge current. Emits the
   * current status immediately for a late subscriber.
   */
  subscribeStatus(listener: (status: WatchStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  status(): WatchStatus {
    return { pendingCount: this.pending.length, latest: this.latestRow };
  }

  /** Seeds the last known deployment from outside the poll, e.g. the read on mount. */
  observe(rows: DeploymentRow[]): void {
    this.rememberLatest(rows);
    this.emitStatus();
  }

  /** Records a save and starts (or keeps) watching for the deploy that carries it. */
  record(save: {
    entryPath: string;
    entryLabel?: string;
    entryUrlPath?: string;
    commitSha: string;
  }): void {
    const now = this.clock.now();
    // Newest commit per path wins: announcing an older version as live when a
    // newer one is still building would be worse than saying nothing.
    this.pending = [
      ...this.prune(this.pending).filter(entry => entry.entryPath !== save.entryPath),
      { ...save, savedAt: now },
    ];
    this.persist();
    // Restart the "has anything reported yet" window, or a save late in a
    // silent watch, or a resumed ledger, is dropped before its first poll.
    this.startedAt = now;
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
    // Bounded on BOTH sides: a savedAt in the future (stamped by a fast clock,
    // since corrected) would never expire and would pin the poll at 5s forever.
    return entries.filter(
      entry => now - entry.savedAt < LEDGER_TTL_MS && entry.savedAt <= now + SINCE_SKEW_MS,
    );
  }

  private persist() {
    this.ledger.save(this.pending);
    // Every mutation of the ledger goes through here, so the pill cannot drift
    // out of step with what is actually pending.
    this.emitStatus();
  }

  /**
   * The latest deploy OF THE SITE'S OWN BRANCH: `observe` is fed the Deploys
   * page's unscoped read, and a workflow branch's preview must not read as
   * live. A row with no branch is kept, since some hosts report none.
   */
  private rememberLatest(rows: DeploymentRow[]) {
    for (const row of rows) {
      if (this.siteBranch && row.branch && row.branch !== this.siteBranch) {
        continue;
      }
      if (!this.latestRow || Date.parse(row.updated_at) > Date.parse(this.latestRow.updated_at)) {
        this.latestRow = row;
      }
    }
  }

  private emitStatus() {
    const status = this.status();
    for (const listener of [...this.statusListeners]) {
      listener(status);
    }
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
      this.rememberLatest(rows);
      this.emitStatus();
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
    this.resolve(rows)
      .catch(error => {
        console.warn('Deploy resolution failed', error);
      })
      .finally(() => {
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
      // Match on identity (path + sha), not path: the editor may have re-saved
      // one of these entries at a newer commit during the awaits above, and
      // that save is still building.
      const resolved = new Set(contained.map(saveKey));
      const stillPending = this.pending.filter(entry => resolved.has(saveKey(entry)));
      if (stillPending.length === 0) {
        continue;
      }
      this.pending = this.pending.filter(entry => !resolved.has(saveKey(entry)));
      this.persist();
      this.emit({
        status: 'live',
        entries: stillPending.map(({ entryPath, entryLabel, entryUrlPath }) => ({
          entryPath,
          entryLabel,
          entryUrlPath,
        })),
        targetUrl: row.target_url,
        deployment: row,
      });
    }

    for (const row of [...rows].filter(r => r.state === 'failed').sort(byOldest)) {
      const contained = (await this.containedIn(row)).filter(entry => !entry.failureReported);
      if (contained.length === 0) {
        continue;
      }
      // Same identity match, or a newer save's own failure would be swallowed.
      const resolved = new Set(contained.map(saveKey));
      const stillPending = this.pending.filter(entry => resolved.has(saveKey(entry)));
      if (stillPending.length === 0) {
        continue;
      }
      // Reported, but kept: a later deploy may still carry these changes live,
      // and the editor should hear about that too.
      this.pending = this.pending.map(entry =>
        resolved.has(saveKey(entry)) ? { ...entry, failureReported: true } : entry,
      );
      this.persist();
      this.emit({
        status: 'failed',
        entries: stillPending.map(({ entryPath, entryLabel, entryUrlPath }) => ({
          entryPath,
          entryLabel,
          entryUrlPath,
        })),
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
        // No fallback guess: comparing two clocks is no evidence a change is
        // live. Ask again next poll; if it never answers, the save expires.
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
  'branch',
  'source',
  'external_id',
  'provider_label',
  'state',
  'target_url',
  'error_message',
  'environment',
  'started_at',
  'finished_at',
  'updated_at',
].join(',');

const COMMIT_COLUMNS = [
  'commit_sha',
  'branch',
  'entry_label',
  'entry_path',
  'message',
  'created_at',
].join(',');

/** More rows than any window should hold, so one read cannot become large. */
const DEPLOYMENT_LIMIT = 20;

/**
 * The window the Deploys page works over: deep enough for a branch filter on a
 * workflow site, which reports about three rows per commit.
 */
export const HISTORY_LIMIT = 200;

export interface DeploymentFetcherConfig {
  /** Project root, e.g. `https://<ref>.supabase.co` — no trailing path. */
  baseUrl: string;
  anonKey: string;
  siteId: string;
  branch: string;
  /** Read per request: the session refresh rotates the token. */
  getAccessToken: () => string | null | undefined;
  fetchImpl?: typeof fetch;
}

/**
 * Reads `site_deployments` through PostgREST. RLS is the boundary; the
 * `site_id` filter keeps a stale JWT from returning another site's rows.
 */
async function queryDeployments(
  config: DeploymentFetcherConfig,
  extra: Record<string, string>,
  limit: number,
  { scopeToBranch = true }: { scopeToBranch?: boolean } = {},
): Promise<DeploymentRow[]> {
  const doFetch = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const accessToken = config.getAccessToken();

  if (!accessToken) {
    // The anon key alone cannot satisfy the select policy, so a request now
    // would be a guaranteed empty read that looks like "no deploy".
    throw new Error('Deploy status requires a signed-in session');
  }

  const params = new URLSearchParams({
    select: DEPLOYMENT_COLUMNS,
    site_id: `eq.${config.siteId}`,
    // The notification poll is scoped to the site's branch: a deploy of an
    // editorial-workflow branch must never resolve a published save. The page
    // is not, because "which branch did this go to" is exactly what it is for.
    ...(scopeToBranch ? { branch: `eq.${config.branch}` } : {}),
    ...extra,
    order: 'updated_at.desc',
    limit: String(limit),
  });

  const response = await doFetch(`${config.baseUrl}/rest/v1/site_deployments?${params}`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
      // See supabase.ts: RLS takes the site from here before the JWT claim.
      'x-site-id': config.siteId,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Deploy status request failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as DeploymentRow[]) : [];
}

export function createDeploymentFetcher(config: DeploymentFetcherConfig) {
  return function fetchDeployments(sinceIso: string): Promise<DeploymentRow[]> {
    return queryDeployments(config, { updated_at: `gte.${sinceIso}` }, DEPLOYMENT_LIMIT);
  };
}

/**
 * The unbounded read behind the Deploys page and the one status read the app
 * makes on mount. No `updated_at` floor: the page is history, not a window.
 */
export function createDeploymentLister(config: DeploymentFetcherConfig) {
  return function listDeployments(limit = HISTORY_LIMIT): Promise<DeploymentRow[]> {
    return queryDeployments(config, {}, Math.min(limit, HISTORY_LIMIT), { scopeToBranch: false });
  };
}

/**
 * Recent CMS saves for this site, so the page can name the entry a deploy
 * carried. Shared rather than per-browser: `site_commits` is written by the
 * commit endpoint, so a colleague's save is legible too.
 */
export function createCommitLister(config: DeploymentFetcherConfig) {
  return async function listCommits(limit = HISTORY_LIMIT): Promise<CommitRow[]> {
    const doFetch = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    const accessToken = config.getAccessToken();

    if (!accessToken) {
      throw new Error('Deploy status requires a signed-in session');
    }

    const params = new URLSearchParams({
      select: COMMIT_COLUMNS,
      site_id: `eq.${config.siteId}`,
      order: 'created_at.desc',
      limit: String(Math.min(limit, HISTORY_LIMIT)),
    });

    const response = await doFetch(`${config.baseUrl}/rest/v1/site_commits?${params}`, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        'x-site-id': config.siteId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Deploy status request failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as CommitRow[]) : [];
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
  // The transport and the watcher reference each other, so one is late-bound.
  const holder: { watcher: DeployWatcher | null } = { watcher: null };

  const transport = createPollingTransport(createDeploymentFetcher(config), {
    intervalMs: () => holder.watcher?.intervalMs() ?? POLL_STEPS[0].everyMs,
    clock: config.clock,
  });

  holder.watcher = new DeployWatcher({
    transport,
    isCommitContained: config.isCommitContained,
    siteBranch: config.branch,
    ledger: config.ledger ?? createLocalStorageLedger(`decap-turbo:deploys:${config.siteId}`),
    clock: config.clock,
  });

  return holder.watcher;
}
