import {
  createCommitLister,
  createDeploymentFetcher,
  createDeploymentLister,
  parseDeployStatusOptions,
  createLocalStorageLedger,
  createMemoryLedger,
  createPollingTransport,
  DeployWatcher,
  FIRST_SIGN_TIMEOUT_MS,
  HISTORY_LIMIT,
  LEDGER_TTL_MS,
  MAX_CONSECUTIVE_ERRORS,
  pollIntervalFor,
} from '../deployWatcher';

import type {
  DeploymentRow,
  WatchStatus,
  DeployResolution,
  DeployTransport,
  LedgerStore,
} from '../deployWatcher';

function row(overrides: Partial<DeploymentRow> = {}): DeploymentRow {
  return {
    commit_sha: 'sha-1',
    source: 'github_deployment',
    external_id: '1',
    provider_label: 'Netlify',
    state: 'success',
    target_url: 'https://site.example',
    error_message: null,
    started_at: '2026-09-02T10:00:00Z',
    finished_at: '2026-09-02T10:01:00Z',
    updated_at: '2026-09-02T10:01:00Z',
    ...overrides,
  };
}

/** Timers and `now` the test drives by hand — the watcher's decisions are all
 *  about elapsed time, and none of them should need real seconds to observe. */
function fakeClock() {
  let nextHandle = 1;
  let now = 1_000_000;
  const pending = new Map<number, { at: number; handler: () => void }>();

  return {
    clock: {
      setTimeout: (handler: () => void, ms: number) => {
        const handle = nextHandle++;
        pending.set(handle, { at: now + ms, handler });
        return handle;
      },
      clearTimeout: (handle: unknown) => {
        pending.delete(handle as number);
      },
      now: () => now,
    },
    /** Moves the clock without firing timers — for "time passed between polls". */
    advanceClock(ms: number) {
      now += ms;
    },
    get pendingCount() {
      return pending.size;
    },
  };
}

/** Lets a test deliver rows as if the transport had read them. */
function manualTransport() {
  let push: ((rows: DeploymentRow[]) => void) | null = null;
  let fail: ((error: unknown) => void) | null = null;
  let since: (() => string) | null = null;
  const stop = jest.fn();
  const start = jest.fn((getSince, onRows, onError) => {
    since = getSince;
    push = onRows;
    fail = onError;
    return stop;
  });

  return {
    transport: { start } as unknown as DeployTransport,
    start,
    stop,
    since: () => since!(),
    deliver: (rows: DeploymentRow[]) => push!(rows),
    error: (error: unknown = new Error('offline')) => fail!(error),
  };
}

async function flush() {
  for (let tick = 0; tick < 10; tick += 1) {
    await Promise.resolve();
  }
}

function makeWatcher(
  overrides: {
    contained?: jest.Mock;
    ledger?: LedgerStore;
    siteBranch?: string | null;
  } = {},
) {
  const timers = fakeClock();
  const transport = manualTransport();
  const isCommitContained = overrides.contained ?? jest.fn().mockResolvedValue(false);
  const resolutions: DeployResolution[] = [];

  const watcher = new DeployWatcher({
    transport: transport.transport,
    isCommitContained,
    siteBranch: overrides.siteBranch ?? null,
    ledger: overrides.ledger ?? createMemoryLedger(),
    clock: timers.clock,
  });
  watcher.subscribe(resolution => resolutions.push(resolution));

  return { watcher, transport, timers, isCommitContained, resolutions };
}

describe('pollIntervalFor', () => {
  // Flat 5s polling was fine for a 20s watch. Across a real build it is 240
  // requests for one save; this is ~54 for the same window.
  it('backs off as the wait grows', () => {
    expect(pollIntervalFor(0)).toBe(5000);
    expect(pollIntervalFor(59_000)).toBe(5000);
    expect(pollIntervalFor(60_000)).toBe(15_000);
    expect(pollIntervalFor(179_000)).toBe(15_000);
    expect(pollIntervalFor(180_000)).toBe(30_000);
    expect(pollIntervalFor(60 * 60_000)).toBe(30_000);
  });
});

describe('DeployWatcher ledger', () => {
  it('does not resolve a save made while the ancestry check was in flight', async () => {
    // resolve() awaits one compare per pending entry, and record() replaces
    // this.pending wholesale. A re-save landing inside that window used to be
    // removed from the ledger by PATH along with the older save it replaced —
    // so the still-building commit was dropped and the editor was told the
    // entry was live.
    let release: ((contained: boolean) => void) | null = null;
    const contained = jest.fn().mockImplementation(
      (from: string) =>
        new Promise<boolean>(resolve => {
          if (from === 'c1') {
            release = resolve;
          } else {
            resolve(from === 'c2');
          }
        }),
    );

    const { watcher, transport, resolutions } = makeWatcher({ contained });

    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'c1' });
    watcher.record({ entryPath: 'posts/b.md', entryLabel: 'B', commitSha: 'c2' });

    transport.deliver([row({ commit_sha: 'c2', state: 'success' })]);
    await flush();

    // The editor re-saves A while the compare for c1 is still outstanding.
    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'c3' });
    release!(true);
    await flush();

    // B shipped and is announced; A's newer commit is untouched.
    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].status).toBe('live');
    expect(resolutions[0].entries.map(e => e.entryPath)).toEqual(['posts/b.md']);
    expect(watcher.isWatching).toBe(true);
  });

  it('keeps one row per entry, at the newest commit', () => {
    const { watcher, transport, resolutions, isCommitContained } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'old' });
    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'new' });

    // A deploy of the superseded commit must not announce the entry as live:
    // the version the editor is waiting on is the newer one.
    transport.deliver([row({ commit_sha: 'old' })]);

    expect(resolutions).toHaveLength(0);
    expect(isCommitContained).toHaveBeenCalledWith('new', 'old');
  });

  it('announces the entry when the deploy is of its own commit', async () => {
    const { watcher, transport, resolutions, isCommitContained } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'sha-1' });
    transport.deliver([row({ commit_sha: 'sha-1' })]);
    await flush();

    expect(resolutions).toEqual([
      expect.objectContaining({
        status: 'live',
        entries: [{ entryPath: 'posts/a.md', entryLabel: 'A' }],
        targetUrl: 'https://site.example',
      }),
    ]);
    // An exact match is answered without asking git anything.
    expect(isCommitContained).not.toHaveBeenCalled();
  });

  it('announces several entries carried by one deploy as one resolution', async () => {
    const contained = jest.fn().mockResolvedValue(true);
    const { watcher, transport, resolutions } = makeWatcher({ contained });

    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'sha-a' });
    watcher.record({ entryPath: 'posts/b.md', entryLabel: 'B', commitSha: 'sha-b' });
    transport.deliver([row({ commit_sha: 'sha-b' })]);
    await flush();

    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].entries.map(e => e.entryPath)).toEqual(['posts/a.md', 'posts/b.md']);
  });
});

describe('DeployWatcher ancestry', () => {
  // The whole point of §A4b: a build cancelled in favour of a newer commit
  // still ships the change, inside that newer deploy.
  it("announces a change carried live by a later deploy of someone else's commit", async () => {
    const contained = jest.fn().mockResolvedValue(true);
    const { watcher, transport, resolutions } = makeWatcher({ contained });

    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'mine' });
    transport.deliver([row({ commit_sha: 'theirs' })]);
    await flush();

    expect(contained).toHaveBeenCalledWith('mine', 'theirs');
    expect(resolutions[0]).toMatchObject({ status: 'live' });
  });

  it('says nothing about a deploy that does not contain the change', async () => {
    const contained = jest.fn().mockResolvedValue(false);
    const { watcher, transport, resolutions } = makeWatcher({ contained });

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'mine' });
    transport.deliver([row({ commit_sha: 'unrelated' })]);
    await flush();

    expect(resolutions).toHaveLength(0);
  });

  it('asks git once per commit pair, not once per poll', async () => {
    const contained = jest.fn().mockResolvedValue(false);
    const { watcher, transport } = makeWatcher({ contained });

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'mine' });
    transport.deliver([row({ commit_sha: 'theirs' })]);
    await flush();
    transport.deliver([row({ commit_sha: 'theirs' })]);
    await flush();

    expect(contained).toHaveBeenCalledTimes(1);
  });

  // "Your change is live" is the one claim this feature exists to make
  // trustworthy, so an unanswerable ancestry question resolves nothing.
  it('leaves the save pending when the ancestry check fails, and never guesses', async () => {
    const contained = jest.fn().mockRejectedValue(new Error('rate limited'));
    const { watcher, transport, resolutions } = makeWatcher({ contained });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'mine' });
    transport.deliver([row({ commit_sha: 'theirs' })]);
    await flush();

    expect(resolutions).toHaveLength(0);

    // Asked again next poll rather than written off.
    contained.mockResolvedValue(true);
    transport.deliver([row({ commit_sha: 'theirs' })]);
    await flush();

    expect(resolutions[0]).toMatchObject({ status: 'live' });
  });
});

describe('DeployWatcher outcomes', () => {
  it('reports a failure but keeps waiting, so a later deploy can still say it is live', async () => {
    const { watcher, transport, resolutions } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'sha-1' });
    transport.deliver([
      row({ commit_sha: 'sha-1', state: 'failed', target_url: 'https://logs.example' }),
    ]);
    await flush();

    expect(resolutions[0]).toMatchObject({ status: 'failed', targetUrl: 'https://logs.example' });

    // Same failure again on the next poll: reported once, not on repeat.
    transport.deliver([row({ commit_sha: 'sha-1', state: 'failed' })]);
    await flush();
    expect(resolutions).toHaveLength(1);

    // Someone fixes the build; the change ships after all.
    transport.deliver([row({ commit_sha: 'sha-1', state: 'success', external_id: '2' })]);
    await flush();

    expect(resolutions).toHaveLength(2);
    expect(resolutions[1]).toMatchObject({ status: 'live' });
  });

  // Netlify's "skip in favour of a newer commit", and GitHub's `inactive`.
  it('says nothing at all about a cancelled deploy and keeps the save pending', async () => {
    const { watcher, transport, resolutions } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    transport.deliver([row({ commit_sha: 'sha-1', state: 'canceled' })]);
    await flush();

    expect(resolutions).toHaveLength(0);
    expect(watcher.isWatching).toBe(true);
  });

  it('says nothing while a deploy is still running', async () => {
    const { watcher, transport, resolutions } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    transport.deliver([row({ commit_sha: 'sha-1', state: 'building' })]);
    transport.deliver([row({ commit_sha: 'sha-1', state: 'pending' })]);
    await flush();

    expect(resolutions).toHaveLength(0);
  });

  it('stops once every save has been accounted for', async () => {
    const { watcher, transport } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    transport.deliver([row({ commit_sha: 'sha-1' })]);
    await flush();

    expect(transport.stop).toHaveBeenCalled();
    expect(watcher.isWatching).toBe(false);
  });
});

describe('DeployWatcher giving up', () => {
  // The common case per §A0: no deploy hook reports to us at all. It must
  // produce no notification whatsoever — the save already had its own toast.
  it('stops silently when no deployment is ever reported', async () => {
    const { watcher, transport, timers, resolutions } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    transport.deliver([]);
    expect(watcher.isWatching).toBe(true);

    timers.advanceClock(FIRST_SIGN_TIMEOUT_MS + 1000);
    transport.deliver([]);
    await flush();

    expect(resolutions).toHaveLength(0);
    expect(transport.stop).toHaveBeenCalled();
  });

  it('keeps waiting past that window once any deploy has been seen', async () => {
    const contained = jest.fn().mockResolvedValue(false);
    const { watcher, transport, timers } = makeWatcher({ contained });

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    transport.deliver([row({ commit_sha: 'other', state: 'building' })]);
    await flush();

    timers.advanceClock(FIRST_SIGN_TIMEOUT_MS + 1000);
    transport.deliver([]);
    await flush();

    expect(watcher.isWatching).toBe(true);
  });

  it('forgets a save nobody ever reported on, rather than watching forever', async () => {
    const { watcher, transport, timers, resolutions } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    transport.deliver([row({ commit_sha: 'other', state: 'building' })]);
    await flush();

    timers.advanceClock(LEDGER_TTL_MS + 1000);
    transport.deliver([row({ commit_sha: 'sha-1' })]);
    await flush();

    expect(resolutions).toHaveLength(0);
    expect(watcher.isWatching).toBe(false);
  });

  // A save made just before the window closes must not be thrown away with it.
  it('restarts the silent-watch window when another save arrives', async () => {
    const { watcher, transport, timers, resolutions } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    timers.advanceClock(FIRST_SIGN_TIMEOUT_MS - 1000);
    watcher.record({ entryPath: 'posts/b.md', commitSha: 'sha-2' });

    timers.advanceClock(2000);
    transport.deliver([]);
    await flush();

    expect(watcher.isWatching).toBe(true);

    transport.deliver([row({ commit_sha: 'sha-2' })]);
    await flush();
    expect(resolutions[0]).toMatchObject({ status: 'live' });
  });

  // Same reason: a ledger restored after a reload has not had its chance yet.
  it('gives a resumed ledger a fresh window rather than discarding it', async () => {
    const ledger = createMemoryLedger();
    const first = makeWatcher({ ledger });
    first.watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    first.timers.advanceClock(FIRST_SIGN_TIMEOUT_MS + 1000);

    const second = makeWatcher({ ledger });
    second.transport.deliver([]);
    await flush();

    expect(second.watcher.isWatching).toBe(true);
  });

  it('stops polling when the last listener goes away, keeping the ledger', () => {
    const ledger = createMemoryLedger();
    const timers = fakeClock();
    const transport = manualTransport();
    const watcher = new DeployWatcher({
      transport: transport.transport,
      isCommitContained: jest.fn(),
      ledger,
      clock: timers.clock,
    });

    const unsubscribe = watcher.subscribe(() => undefined);
    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    expect(watcher.isWatching).toBe(true);

    unsubscribe();

    expect(watcher.isWatching).toBe(false);
    expect(ledger.load()).toHaveLength(1);
  });

  it('gives up after repeated transport failures, leaving the ledger to be resumed', () => {
    const ledger = createMemoryLedger();
    const { watcher, transport } = makeWatcher({ ledger });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    for (let i = 0; i < MAX_CONSECUTIVE_ERRORS - 1; i += 1) {
      transport.error();
    }
    expect(transport.stop).not.toHaveBeenCalled();

    transport.error();

    expect(transport.stop).toHaveBeenCalled();
    expect(ledger.load()).toHaveLength(1);
  });
});

describe('DeployWatcher persistence', () => {
  it('resumes a ledger left by a previous page load when something subscribes', () => {
    const ledger = createMemoryLedger();
    const first = makeWatcher({ ledger });
    first.watcher.record({ entryPath: 'posts/a.md', entryLabel: 'A', commitSha: 'sha-1' });
    first.watcher.stop();

    const second = makeWatcher({ ledger });

    expect(second.transport.start).toHaveBeenCalled();
    expect(second.watcher.isWatching).toBe(true);
  });

  it('does not read the deploy window from before the oldest pending save', () => {
    const { watcher, transport, timers } = makeWatcher();

    watcher.record({ entryPath: 'posts/a.md', commitSha: 'sha-1' });
    const since = Date.parse(transport.since());

    expect(since).toBeLessThanOrEqual(timers.clock.now());
    expect(since).toBeGreaterThan(timers.clock.now() - 120_000);
  });
});

describe('createLocalStorageLedger', () => {
  const key = 'decap-turbo:deploys:test';

  beforeEach(() => localStorage.clear());

  it('round-trips the ledger', () => {
    const ledger = createLocalStorageLedger(key);
    const entries = [{ entryPath: 'posts/a.md', commitSha: 'sha-1', savedAt: 1 }];

    ledger.save(entries);

    expect(createLocalStorageLedger(key).load()).toEqual(entries);
  });

  it('clears the key rather than storing an empty list', () => {
    const ledger = createLocalStorageLedger(key);
    ledger.save([{ entryPath: 'posts/a.md', commitSha: 'sha-1', savedAt: 1 }]);

    ledger.save([]);

    expect(localStorage.getItem(key)).toBeNull();
  });

  // Losing a notification is a far smaller problem than a save path that throws.
  it('survives unreadable storage', () => {
    localStorage.setItem(key, 'not json');

    expect(createLocalStorageLedger(key).load()).toEqual([]);
  });
});

describe('createPollingTransport', () => {
  it('reads immediately, then on the interval the watcher asks for', async () => {
    const timers = fakeClock();
    const fetchRows = jest.fn().mockResolvedValue([]);
    let interval = 5000;

    createPollingTransport(fetchRows, {
      intervalMs: () => interval,
      clock: timers.clock,
    }).start(() => '2026-09-02T10:00:00Z', jest.fn(), jest.fn());
    await flush();

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(fetchRows).toHaveBeenCalledWith('2026-09-02T10:00:00Z');
    expect(timers.pendingCount).toBe(1);

    interval = 30_000;
    await flush();
  });

  it('drops an in-flight read once stopped, and schedules nothing further', async () => {
    const timers = fakeClock();
    let resolveFetch: ((rows: DeploymentRow[]) => void) | null = null;
    const fetchRows = jest.fn(
      () => new Promise<DeploymentRow[]>(resolve => (resolveFetch = resolve)),
    );
    const onRows = jest.fn();

    const stop = createPollingTransport(fetchRows, {
      intervalMs: () => 5000,
      clock: timers.clock,
    }).start(() => 'since', onRows, jest.fn());
    stop();
    resolveFetch!([row()]);
    await flush();

    expect(onRows).not.toHaveBeenCalled();
    expect(timers.pendingCount).toBe(0);
  });
});

describe('createDeploymentFetcher', () => {
  const config = {
    baseUrl: 'https://project.supabase.co',
    anonKey: 'anon-key',
    siteId: 'site-1',
    branch: 'main',
    getAccessToken: () => 'jwt-token',
  };

  // Filtered by branch, not by commit: the deploy that carries a change live
  // is not always the deploy of that commit.
  it('reads the branch window with the user JWT', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([row()])),
    });

    const rows = await createDeploymentFetcher({ ...config, fetchImpl } as never)(
      '2026-09-02T10:00:00.000Z',
    );

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('/rest/v1/site_deployments?');
    expect(url).toContain('site_id=eq.site-1');
    expect(url).toContain('branch=eq.main');
    expect(url).toContain('updated_at=gte.2026-09-02T10');
    expect(url).not.toContain('commit_sha=');
    expect(init.headers.Authorization).toBe('Bearer jwt-token');
    expect(rows).toEqual([row()]);
  });

  it('refuses to read without a session rather than reporting a false absence', async () => {
    const fetchImpl = jest.fn();

    await expect(
      createDeploymentFetcher({ ...config, getAccessToken: () => null, fetchImpl } as never)('t'),
    ).rejects.toThrow(/session/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });

    await expect(createDeploymentFetcher({ ...config, fetchImpl } as never)('t')).rejects.toThrow(
      /403/,
    );
  });

  it('treats an empty body as no deployments', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') });

    await expect(createDeploymentFetcher({ ...config, fetchImpl } as never)('t')).resolves.toEqual(
      [],
    );
  });
});

describe('createDeploymentLister', () => {
  const config = {
    baseUrl: 'https://project.supabase.co',
    anonKey: 'anon-key',
    siteId: 'site-1',
    branch: 'main',
    getAccessToken: () => 'jwt-token',
  };

  it('reads history with no time floor', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([row()])),
    });

    await createDeploymentLister({ ...config, fetchImpl } as never)();

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toContain('site_id=eq.site-1');
    // The page is history, not a window — an `updated_at` floor would hide
    // exactly the older deploys someone opened it to see.
    expect(url).not.toContain('updated_at=');
    expect(url).toContain('order=updated_at.desc');
    // And NOT scoped to the site branch: "which branch did this go to" is
    // exactly what the page is for, so editorial-workflow deploys belong in it.
    expect(url).not.toContain('branch=eq.');
  });

  it('caps the caller\u2019s limit so one read cannot become large', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('[]') });

    await createDeploymentLister({ ...config, fetchImpl } as never)(5000);

    expect(fetchImpl.mock.calls[0][0]).toContain(`limit=${HISTORY_LIMIT}`);
  });
});

describe('parseDeployStatusOptions', () => {
  it('defaults to on, because the surfaces auto-hide anyway', () => {
    expect(parseDeployStatusOptions(undefined)).toEqual({
      enabled: true,
      notifications: true,
      page: true,
      primaryTarget: null,
    });
  });

  it('turns everything off for `deploy_status: false`', () => {
    expect(parseDeployStatusOptions(false)).toEqual({
      enabled: false,
      notifications: false,
      page: false,
      primaryTarget: null,
    });
  });

  it('turns off one surface at a time', () => {
    expect(parseDeployStatusOptions({ notifications: false })).toMatchObject({
      enabled: true,
      notifications: false,
      page: true,
    });
    expect(parseDeployStatusOptions({ page: false })).toMatchObject({
      notifications: true,
      page: false,
    });
  });

  // Otherwise `{ enabled: false, page: true }` leaves a nav item that can
  // never show anything.
  it('lets `enabled: false` override the sub-keys', () => {
    expect(
      parseDeployStatusOptions({ enabled: false, page: true, notifications: true }),
    ).toMatchObject({
      enabled: false,
      page: false,
      notifications: false,
    });
  });

  it('reads primary_target', () => {
    expect(parseDeployStatusOptions({ primary_target: '  Netlify  ' }).primaryTarget).toBe(
      'Netlify',
    );
    expect(parseDeployStatusOptions({ primary_target: '   ' }).primaryTarget).toBeNull();
    expect(parseDeployStatusOptions({ primary_target: 7 }).primaryTarget).toBeNull();
  });
});

describe('DeployWatcher status channel', () => {
  it('emits the current status immediately, so a late subscriber is not blank', () => {
    const { watcher } = makeWatcher();
    const seen: WatchStatus[] = [];

    watcher.subscribeStatus(status => seen.push(status));

    expect(seen).toEqual([{ pendingCount: 0, latest: null }]);
  });

  it('follows the ledger as saves are recorded and resolved', async () => {
    const contained = jest.fn().mockResolvedValue(true);
    const { watcher, transport } = makeWatcher({ contained });
    const seen: WatchStatus[] = [];
    watcher.subscribeStatus(status => seen.push(status));

    watcher.record({ entryPath: 'a.md', commitSha: 'aaa' });
    expect(seen[seen.length - 1].pendingCount).toBe(1);

    watcher.record({ entryPath: 'b.md', commitSha: 'bbb' });
    expect(seen[seen.length - 1].pendingCount).toBe(2);

    transport.deliver([row({ commit_sha: 'bbb', state: 'success' })]);
    await flush();

    expect(seen[seen.length - 1].pendingCount).toBe(0);
    expect(seen[seen.length - 1].latest).toMatchObject({ commit_sha: 'bbb' });
  });

  // The whole cost argument of A4b rests on this: a badge that polls to stay
  // current would have an idle CMS reading forever.
  it('never starts a poll', () => {
    const { watcher, transport } = makeWatcher();

    watcher.subscribeStatus(() => undefined);

    expect(transport.start).not.toHaveBeenCalled();
    expect(watcher.isWatching).toBe(false);
  });

  it('stops emitting once unsubscribed', () => {
    const { watcher } = makeWatcher();
    const seen: WatchStatus[] = [];
    const unsubscribe = watcher.subscribeStatus(status => seen.push(status));

    unsubscribe();
    watcher.record({ entryPath: 'a.md', commitSha: 'aaa' });

    expect(seen).toHaveLength(1);
  });

  it('takes the latest deploy from a read it did not make', () => {
    // The one read the app makes on mount, so an editor who has saved nothing
    // this session still sees whether the site is live or broken.
    const { watcher } = makeWatcher();
    const seen: WatchStatus[] = [];
    watcher.subscribeStatus(status => seen.push(status));

    watcher.observe([
      row({ commit_sha: 'old', updated_at: '2026-09-02T10:00:00.000Z' }),
      row({ commit_sha: 'new', updated_at: '2026-09-02T11:00:00.000Z' }),
    ]);

    expect(seen[seen.length - 1].latest).toMatchObject({ commit_sha: 'new' });
  });

  // `observe` is fed the Deploys page's read, which is deliberately unscoped so
  // the page can show editorial-workflow branches. The pill is not the page:
  // measured on the tester, an unpublish branch-deployed `cms/posts/…` and the
  // pill announced a preview of an unpublished entry as the site being live.
  it('ignores a deploy of another branch', () => {
    const { watcher } = makeWatcher({ siteBranch: 'turbo' });

    watcher.observe([
      row({
        commit_sha: 'workflow',
        branch: 'cms/posts/x',
        updated_at: '2026-09-02T11:00:00.000Z',
      }),
      row({ commit_sha: 'site', branch: 'turbo', updated_at: '2026-09-02T10:00:00.000Z' }),
    ]);

    expect(watcher.status().latest).toMatchObject({ commit_sha: 'site' });
  });

  // Some hosts report no branch at all; refusing those would leave such a site
  // permanently unable to say anything about itself.
  it('keeps a row that names no branch', () => {
    const { watcher } = makeWatcher({ siteBranch: 'turbo' });

    watcher.observe([row({ commit_sha: 'nameless', branch: null })]);

    expect(watcher.status().latest).toMatchObject({ commit_sha: 'nameless' });
  });

  it('does not let an older row overwrite a newer one', () => {
    const { watcher } = makeWatcher();
    watcher.observe([row({ commit_sha: 'new', updated_at: '2026-09-02T11:00:00.000Z' })]);
    watcher.observe([row({ commit_sha: 'old', updated_at: '2026-09-02T09:00:00.000Z' })]);

    expect(watcher.status().latest).toMatchObject({ commit_sha: 'new' });
  });
});

describe('DeployWatcher entry URLs', () => {
  it('carries the entry path through to the resolution', () => {
    // Resolved at save time, because that is the only moment the collection's
    // preview_path template and the entry's fields are both in hand.
    const contained = jest.fn().mockResolvedValue(true);
    const { watcher, transport, resolutions } = makeWatcher({ contained });

    watcher.record({
      entryPath: 'content/posts/a.md',
      entryLabel: 'A post',
      entryUrlPath: '/blog/a/',
      commitSha: 'aaa',
    });
    transport.deliver([row({ commit_sha: 'aaa', state: 'success' })]);

    return flush().then(() => {
      expect(resolutions[0].entries[0]).toEqual({
        entryPath: 'content/posts/a.md',
        entryLabel: 'A post',
        entryUrlPath: '/blog/a/',
      });
    });
  });

  it('survives a save with no entry path at all', () => {
    const contained = jest.fn().mockResolvedValue(true);
    const { watcher, transport, resolutions } = makeWatcher({ contained });

    watcher.record({ entryPath: 'a.md', commitSha: 'aaa' });
    transport.deliver([row({ commit_sha: 'aaa', state: 'success' })]);

    return flush().then(() => {
      expect(resolutions[0].entries[0].entryUrlPath).toBeUndefined();
    });
  });
});

describe('createCommitLister', () => {
  const config = {
    baseUrl: 'https://project.supabase.co',
    anonKey: 'anon-key',
    siteId: 'site-1',
    branch: 'main',
    getAccessToken: () => 'jwt-token',
  };

  it('reads this site\u2019s recent saves', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify([{ commit_sha: 'aaa', entry_label: 'Spring menu' }])),
    });

    const rows = await createCommitLister({ ...config, fetchImpl } as never)();

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('/rest/v1/site_commits?');
    expect(url).toContain('site_id=eq.site-1');
    expect(url).toContain('order=created_at.desc');
    expect(init.headers.Authorization).toBe('Bearer jwt-token');
    expect(rows[0].entry_label).toBe('Spring menu');
  });

  it('caps the limit like the deploy history does', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('[]') });

    await createCommitLister({ ...config, fetchImpl } as never)(9999);

    expect(fetchImpl.mock.calls[0][0]).toContain(`limit=${HISTORY_LIMIT}`);
  });

  it('refuses to read without a session', async () => {
    const fetchImpl = jest.fn();

    await expect(
      createCommitLister({ ...config, getAccessToken: () => null, fetchImpl } as never)(),
    ).rejects.toThrow(/session/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
