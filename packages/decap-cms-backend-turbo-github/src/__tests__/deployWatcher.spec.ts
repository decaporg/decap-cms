import {
  ABSENT_AFTER_MS,
  createDeploymentFetcher,
  createPollingTransport,
  DeployWatcher,
  MAX_WATCH_MS,
  pickDeployment,
  POLL_INTERVAL_MS,
} from '../deployWatcher';

import type { DeploymentRow, DeployTransport, DeployWatchUpdate } from '../deployWatcher';

function row(overrides: Partial<DeploymentRow> = {}): DeploymentRow {
  return {
    commit_sha: 'abc123',
    source: 'github_deployment',
    external_id: '1',
    provider_label: 'Netlify',
    state: 'building',
    target_url: null,
    error_message: null,
    started_at: '2026-09-02T10:00:00Z',
    finished_at: null,
    updated_at: '2026-09-02T10:00:00Z',
    ...overrides,
  };
}

/**
 * Timers the test drives by hand. The watcher's whole job is deciding when to
 * give up, so those decisions have to be observable without waiting 15 real
 * minutes — and injecting the clock keeps the assertions about elapsed time
 * rather than about jest internals.
 */
function fakeClock() {
  let nextHandle = 1;
  const pending = new Map<number, { at: number; handler: () => void }>();
  let now = 0;

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
    },
    /** Runs every timer due within `ms`, in due order, as real time would. */
    advance(ms: number) {
      const until = now + ms;
      for (;;) {
        const due = [...pending.entries()]
          .filter(([, timer]) => timer.at <= until)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        pending.delete(due[0]);
        now = due[1].at;
        due[1].handler();
      }
      now = until;
    },
    get pendingCount() {
      return pending.size;
    },
  };
}

/** Lets a test push rows in as if the transport had learned them. */
function manualTransport() {
  let push: ((rows: DeploymentRow[]) => void) | null = null;
  let fail: ((error: unknown) => void) | null = null;
  const stop = jest.fn();

  const transport: DeployTransport = {
    start(_commitSha, onRows, onError) {
      push = onRows;
      fail = onError;
      return stop;
    },
  };

  return {
    transport,
    stop,
    deliver: (rows: DeploymentRow[]) => push!(rows),
    error: (error: unknown = new Error('offline')) => fail!(error),
  };
}

/** Drains the microtask queue — jsdom has no setImmediate, and the polling
 *  chain is a few awaits deep. */
async function flush() {
  for (let tick = 0; tick < 5; tick += 1) {
    await Promise.resolve();
  }
}

describe('pickDeployment', () => {
  it('returns null when the commit has produced nothing yet', () => {
    expect(pickDeployment([])).toBeNull();
  });

  // The change IS live somewhere; sending the editor to debug an unrelated
  // build would be worse than saying nothing.
  it('prefers a success over a sibling that failed', () => {
    const picked = pickDeployment([
      row({ external_id: 'a', state: 'failed', updated_at: '2026-09-02T10:05:00Z' }),
      row({ external_id: 'b', state: 'success', finished_at: '2026-09-02T10:01:00Z' }),
    ]);

    expect(picked?.external_id).toBe('b');
  });

  it('takes the first success when several succeeded', () => {
    const picked = pickDeployment([
      row({ external_id: 'late', state: 'success', finished_at: '2026-09-02T10:09:00Z' }),
      row({ external_id: 'early', state: 'success', finished_at: '2026-09-02T10:02:00Z' }),
    ]);

    expect(picked?.external_id).toBe('early');
  });

  // "failed" is not recoverable from once shown, so a deploy that may still
  // succeed outranks one that already didn't.
  it('prefers a still-running deploy over a failed one', () => {
    const picked = pickDeployment([
      row({ external_id: 'a', state: 'failed', updated_at: '2026-09-02T10:05:00Z' }),
      row({ external_id: 'b', state: 'pending', updated_at: '2026-09-02T10:01:00Z' }),
    ]);

    expect(picked?.external_id).toBe('b');
  });

  it('prefers a failure over a cancellation', () => {
    const picked = pickDeployment([
      row({ external_id: 'a', state: 'canceled', updated_at: '2026-09-02T10:09:00Z' }),
      row({ external_id: 'b', state: 'failed', updated_at: '2026-09-02T10:01:00Z' }),
    ]);

    expect(picked?.external_id).toBe('b');
  });

  it('takes the most recently updated of several running deploys', () => {
    const picked = pickDeployment([
      row({ external_id: 'stale', state: 'building', updated_at: '2026-09-02T10:01:00Z' }),
      row({ external_id: 'fresh', state: 'building', updated_at: '2026-09-02T10:06:00Z' }),
    ]);

    expect(picked?.external_id).toBe('fresh');
  });

  it('does not throw on unparseable timestamps', () => {
    const picked = pickDeployment([
      row({ external_id: 'a', state: 'success', finished_at: 'not a date', updated_at: '' }),
    ]);

    expect(picked?.external_id).toBe('a');
  });
});

describe('DeployWatcher', () => {
  it('reports each new state and stops itself once the deploy is live', () => {
    const { transport, stop, deliver } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock: fakeClock().clock });
    const updates: DeployWatchUpdate[] = [];

    watcher.watch('abc123', update => updates.push(update), { entryPath: 'posts/hello.md' });

    deliver([row({ state: 'building' })]);
    deliver([row({ state: 'success', target_url: 'https://site.example', finished_at: 'x' })]);

    expect(updates.map(u => u.status)).toEqual(['building', 'success']);
    expect(updates[1].deployment?.target_url).toBe('https://site.example');
    expect(updates[1].commitSha).toBe('abc123');
    expect(updates[1].entryPath).toBe('posts/hello.md');
    expect(stop).toHaveBeenCalled();
  });

  // A host re-reporting the same state must not make the toast flicker.
  it('does not re-emit an unchanged row', () => {
    const { transport, deliver } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock: fakeClock().clock });
    const listener = jest.fn();

    watcher.watch('abc123', listener);
    deliver([row({ state: 'building', updated_at: '2026-09-02T10:00:00Z' })]);
    deliver([row({ state: 'building', updated_at: '2026-09-02T10:00:05Z' })]);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  // The case most Decap sites are in: no deploy hook at all (§A0).
  it('gives up as `absent` when no row ever arrives', () => {
    const { clock, advance } = fakeClock();
    const { transport, stop } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock });
    const listener = jest.fn();

    watcher.watch('abc123', listener);
    advance(ABSENT_AFTER_MS - 1);
    expect(listener).not.toHaveBeenCalled();

    advance(1);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'absent', deployment: null }),
    );
    expect(stop).toHaveBeenCalled();
  });

  it('an empty read is not "absent" — it is just early', () => {
    const { clock, advance } = fakeClock();
    const { transport, deliver } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock });
    const listener = jest.fn();

    watcher.watch('abc123', listener);
    deliver([]);
    advance(ABSENT_AFTER_MS - 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops watching for "absent" once a deploy has been seen', () => {
    const { clock, advance } = fakeClock();
    const { transport, deliver } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock });
    const listener = jest.fn();

    watcher.watch('abc123', listener);
    deliver([row({ state: 'building' })]);
    advance(ABSENT_AFTER_MS * 2);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: 'building' }));
  });

  it('gives up as `timeout` on a deploy that never finishes', () => {
    const { clock, advance } = fakeClock();
    const { transport, stop, deliver } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock });
    const listener = jest.fn();

    watcher.watch('abc123', listener);
    deliver([row({ state: 'building' })]);
    advance(MAX_WATCH_MS);

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'timeout',
        deployment: expect.objectContaining({ state: 'building' }),
      }),
    );
    expect(stop).toHaveBeenCalled();
  });

  it('a second save supersedes the first watch and silences it', () => {
    const first = manualTransport();
    const watcher = new DeployWatcher(first.transport, { clock: fakeClock().clock });
    const firstListener = jest.fn();
    const secondListener = jest.fn();

    watcher.watch('old-sha', firstListener);
    watcher.watch('new-sha', secondListener);

    expect(first.stop).toHaveBeenCalledTimes(1);

    first.deliver([row({ state: 'success', commit_sha: 'new-sha' })]);

    expect(firstListener).not.toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', commitSha: 'new-sha' }),
    );
  });

  // §A4 mounts this in the app shell, which will hold the handle across saves.
  it('a stop handle from a superseded watch does not stop the current one', () => {
    const first = manualTransport();
    const watcher = new DeployWatcher(first.transport, { clock: fakeClock().clock });
    const secondListener = jest.fn();

    const stopFirst = watcher.watch('old-sha', jest.fn());
    watcher.watch('new-sha', secondListener);
    stopFirst();

    first.deliver([row({ state: 'success' })]);

    expect(secondListener).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  // A poll crossing a token refresh must not end the watch.
  it('tolerates transient failures and degrades only after three in a row', () => {
    const { transport, deliver } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock: fakeClock().clock });
    const listener = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    watcher.watch('abc123', listener);
    watcher['onError'](new Error('offline'));
    watcher['onError'](new Error('offline'));
    deliver([]);
    watcher['onError'](new Error('offline'));
    watcher['onError'](new Error('offline'));
    expect(listener).not.toHaveBeenCalled();

    watcher['onError'](new Error('offline'));

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'absent', deployment: null }),
    );
  });

  it('stop() tears down without emitting anything', () => {
    const timers = fakeClock();
    const { transport, stop } = manualTransport();
    const watcher = new DeployWatcher(transport, { clock: timers.clock });
    const listener = jest.fn();

    watcher.watch('abc123', listener);
    expect(timers.pendingCount).toBe(2);

    watcher.stop();
    timers.advance(MAX_WATCH_MS);

    expect(stop).toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    // Both the grace and the ceiling timer are gone — a watcher that leaked
    // either would fire into a torn-down listener minutes later.
    expect(timers.pendingCount).toBe(0);
  });
});

describe('createPollingTransport', () => {
  it('reads once immediately, then on the interval', async () => {
    const { clock, advance } = fakeClock();
    const fetchRows = jest.fn().mockResolvedValue([]);
    const onRows = jest.fn();

    createPollingTransport(fetchRows, { clock }).start('abc123', onRows, jest.fn());
    await flush();

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(fetchRows).toHaveBeenCalledWith('abc123');

    advance(POLL_INTERVAL_MS);
    await flush();

    expect(fetchRows).toHaveBeenCalledTimes(2);
  });

  it('keeps polling after a failed read', async () => {
    const { clock, advance } = fakeClock();
    const fetchRows = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue([row()]);
    const onError = jest.fn();
    const onRows = jest.fn();

    createPollingTransport(fetchRows, { clock }).start('abc123', onRows, onError);
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);

    advance(POLL_INTERVAL_MS);
    await flush();

    expect(onRows).toHaveBeenCalledWith([row()]);
  });

  // A read in flight when the watch ends must not reach a listener that has
  // already been torn down, nor schedule the next poll.
  it('drops an in-flight read once stopped, and schedules nothing further', async () => {
    const timers = fakeClock();
    let resolveFetch: ((rows: DeploymentRow[]) => void) | null = null;
    const fetchRows = jest.fn(
      () => new Promise<DeploymentRow[]>(resolve => (resolveFetch = resolve)),
    );
    const onRows = jest.fn();

    const stop = createPollingTransport(fetchRows, { clock: timers.clock }).start(
      'abc123',
      onRows,
      jest.fn(),
    );
    stop();
    resolveFetch!([row()]);
    await flush();

    expect(onRows).not.toHaveBeenCalled();
    // Read off the object, not a destructured copy: it is a getter, and a
    // snapshot taken before the stop would pass no matter what.
    expect(timers.pendingCount).toBe(0);

    timers.advance(POLL_INTERVAL_MS * 3);
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });
});

describe('createDeploymentFetcher', () => {
  const config = {
    baseUrl: 'https://project.supabase.co',
    anonKey: 'anon-key',
    siteId: 'site-1',
    getAccessToken: () => 'jwt-token',
  };

  it("asks PostgREST for this site's rows for one commit, with the user JWT", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([row()])),
    });

    const rows = await createDeploymentFetcher({ ...config, fetchImpl } as never)('abc123');

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('/rest/v1/site_deployments?');
    expect(url).toContain('site_id=eq.site-1');
    expect(url).toContain('commit_sha=eq.abc123');
    expect(init.headers.apikey).toBe('anon-key');
    expect(init.headers.Authorization).toBe('Bearer jwt-token');
    expect(rows).toEqual([row()]);
  });

  // The anon key cannot satisfy the select policy, so a request without a
  // session would be a guaranteed empty read that reads as "no deploy".
  it('refuses to read without a session rather than reporting a false absence', async () => {
    const fetchImpl = jest.fn();

    await expect(
      createDeploymentFetcher({ ...config, getAccessToken: () => null, fetchImpl } as never)('abc'),
    ).rejects.toThrow(/session/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reads the token per request, so a session refresh mid-watch is picked up', async () => {
    const tokens = ['first', 'second'];
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('[]') });
    const fetchRows = createDeploymentFetcher({
      ...config,
      getAccessToken: () => tokens.shift() ?? null,
      fetchImpl,
    } as never);

    await fetchRows('abc');
    await fetchRows('abc');

    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer first');
    expect(fetchImpl.mock.calls[1][1].headers.Authorization).toBe('Bearer second');
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });

    await expect(createDeploymentFetcher({ ...config, fetchImpl } as never)('abc')).rejects.toThrow(
      /403/,
    );
  });

  it('treats an empty body as no deployments', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') });

    await expect(
      createDeploymentFetcher({ ...config, fetchImpl } as never)('abc'),
    ).resolves.toEqual([]);
  });
});
