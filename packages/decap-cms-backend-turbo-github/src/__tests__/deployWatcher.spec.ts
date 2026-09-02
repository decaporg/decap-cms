import {
  createDeploymentFetcher,
  createLocalStorageLedger,
  createMemoryLedger,
  createPollingTransport,
  DeployWatcher,
  FIRST_SIGN_TIMEOUT_MS,
  LEDGER_TTL_MS,
  MAX_CONSECUTIVE_ERRORS,
  pollIntervalFor,
} from '../deployWatcher';

import type {
  DeploymentRow,
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
  } = {},
) {
  const timers = fakeClock();
  const transport = manualTransport();
  const isCommitContained = overrides.contained ?? jest.fn().mockResolvedValue(false);
  const resolutions: DeployResolution[] = [];

  const watcher = new DeployWatcher({
    transport: transport.transport,
    isCommitContained,
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
