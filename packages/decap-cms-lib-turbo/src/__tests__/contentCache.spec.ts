import { TurboContentCache } from '../contentCache';

import type { ContentCacheOptions } from '../contentCache';

const apiRoot = 'https://supabase.example/functions/v1/gh';

function entriesAt(paths: string[]) {
  return paths.map(path => ({ file: { path }, data: '' }));
}

function syncAnswer(result: Record<string, unknown>) {
  return jest.fn().mockResolvedValue({ json: () => Promise.resolve(result) });
}

function makeCache(overrides: Partial<ContentCacheOptions> = {}) {
  const supabase = {
    fetchEntries: jest.fn().mockResolvedValue([]),
    fetchEntryByPath: jest.fn().mockResolvedValue(null),
  };
  const cache = new TurboContentCache({
    supabase: supabase as any,
    fetch: syncAnswer({ fresh: false }),
    apiRoot,
    getBranch: () => 'main',
    host: 'GitHub',
    ...overrides,
  });
  return { cache, supabase };
}

describe('TurboContentCache folder listing', () => {
  it('orders entries by code unit, whatever the locale', async () => {
    const { cache, supabase } = makeCache();
    const paths = ['posts/b.md', 'posts/a.md', 'posts/B.md', 'posts/é.md', 'posts/_x.md'];
    supabase.fetchEntries.mockResolvedValue(entriesAt(paths));

    const entries = await cache.allEntriesByFolder('posts', 'md', 1);

    expect(entries.map(entry => entry.file.path)).toEqual([
      'posts/B.md',
      'posts/_x.md',
      'posts/a.md',
      'posts/b.md',
      'posts/é.md',
    ]);
  });

  it('syncs the collection against the current branch before reading it', async () => {
    const fetch = syncAnswer({ fresh: false });
    const { cache, supabase } = makeCache({ fetch, getBranch: () => 'develop' });

    await cache.allEntriesByFolder('posts', 'md', 1, /\.en\..*/, 'term');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${apiRoot}/_content/sync`);
    expect(JSON.parse(init.body)).toEqual({
      collection: {
        name: 'posts:md:1:/\\.en\\..*/',
        folder: 'posts',
        extension: 'md',
        depth: 1,
        pathRegexSource: '\\.en\\..*',
        pathRegexFlags: '',
      },
      branch: 'develop',
    });
    expect(supabase.fetchEntries).toHaveBeenCalledTimes(1);
    expect(supabase.fetchEntries).toHaveBeenCalledWith('posts:md:1:/\\.en\\..*/', 'term');
  });

  it('warns, naming the git host, when the server deferred the sync', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { cache } = makeCache({
      fetch: syncAnswer({ deferred: true, rate_limited: { remaining: 12 } }),
      host: 'GitLab',
    });

    await cache.allEntriesByFolder('posts', 'md', 1);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('the GitLab API budget is low (12 left)'),
    );
    warn.mockRestore();
  });

  describe('speculative read', () => {
    it('keeps the read issued alongside the sync when the server says nothing changed', async () => {
      const { cache, supabase } = makeCache({
        fetch: syncAnswer({ fresh: true }),
        speculativeRead: true,
      });
      supabase.fetchEntries.mockResolvedValue(entriesAt(['posts/a.md']));

      const entries = await cache.allEntriesByFolder('posts', 'md', 1);

      expect(entries).toHaveLength(1);
      expect(supabase.fetchEntries).toHaveBeenCalledTimes(1);
    });

    it('reads again when the sync ingested something', async () => {
      const { cache, supabase } = makeCache({
        fetch: syncAnswer({ fresh: false }),
        speculativeRead: true,
      });

      await cache.allEntriesByFolder('posts', 'md', 1);

      expect(supabase.fetchEntries).toHaveBeenCalledTimes(2);
    });

    it('never lets the early read be the reason a load fails', async () => {
      const { cache, supabase } = makeCache({
        fetch: syncAnswer({ fresh: true }),
        speculativeRead: true,
      });
      supabase.fetchEntries
        .mockRejectedValueOnce(new Error('rls'))
        .mockResolvedValueOnce(entriesAt(['posts/a.md']));

      await expect(cache.allEntriesByFolder('posts', 'md', 1)).resolves.toHaveLength(1);
    });

    it('is off unless asked for, so one read follows the sync', async () => {
      const { cache, supabase } = makeCache({ fetch: syncAnswer({ fresh: true }) });

      await cache.allEntriesByFolder('posts', 'md', 1);

      expect(supabase.fetchEntries).toHaveBeenCalledTimes(1);
    });
  });
});

describe('TurboContentCache locale sibling prefetch', () => {
  const listingRegex = /\.en\..*/;
  const siblingRegex = /\.(?:de|si)\..*/;

  it('syncs the locale siblings under their own collection key', async () => {
    const { cache } = makeCache();
    const sync = jest.spyOn(cache, 'syncCollection').mockResolvedValue({ fresh: true });

    await cache.allEntriesByFolder('content/posts', 'md', 1, listingRegex, undefined, siblingRegex);

    const collections = sync.mock.calls.map(call => call[0]);
    const regexes = sync.mock.calls.map(call => call[4]);

    // Two syncs, and crucially two DIFFERENT collection keys: the sibling rows
    // must not be tagged with the listing's key, or fetchEntries would return
    // three rows per entry and the collection would render each locale as its
    // own card.
    expect(sync).toHaveBeenCalledTimes(2);
    expect(new Set(collections).size).toBe(2);
    expect(regexes).toContain(siblingRegex);
    expect(collections.some(name => name.includes(siblingRegex.toString()))).toBe(true);
  });

  it('does not sync siblings when the collection has none', async () => {
    const { cache } = makeCache();
    const sync = jest.spyOn(cache, 'syncCollection').mockResolvedValue({ fresh: true });

    await cache.allEntriesByFolder('content/posts', 'md', 1, listingRegex);

    expect(sync).toHaveBeenCalledTimes(1);
  });

  it('does not let a failed prefetch fail the collection load', async () => {
    // The prefetch is not awaited, so a rejection here would otherwise surface
    // as an unhandled rejection rather than as a slower entry open.
    const { cache } = makeCache();
    jest
      .spyOn(cache, 'syncCollection')
      .mockImplementation(collection =>
        collection.includes(siblingRegex.toString())
          ? Promise.reject(new Error('sibling sync failed'))
          : Promise.resolve({ fresh: true }),
      );

    await expect(
      cache.allEntriesByFolder('content/posts', 'md', 1, listingRegex, undefined, siblingRegex),
    ).resolves.toEqual([]);
  });
});

describe('TurboContentCache files collections', () => {
  it('asks for nothing when the collection lists no files', async () => {
    const fetch = syncAnswer({});
    const { cache, supabase } = makeCache({ fetch });

    await expect(cache.entriesByFiles([])).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(supabase.fetchEntries).not.toHaveBeenCalled();
  });

  it('syncs the listed paths and reinstates files the repo does not have yet, in config order', async () => {
    const fetch = syncAnswer({});
    const { cache, supabase } = makeCache({ fetch });
    supabase.fetchEntries.mockResolvedValue([{ file: { path: 'data/b.yml' }, data: 'b: 1' }]);

    const entries = await cache.entriesByFiles([
      { path: 'data/a.yml', label: 'A' },
      { path: 'data/b.yml', label: 'B' },
    ]);

    const sent = JSON.parse(fetch.mock.calls[0][1].body);
    expect(sent.collection.files).toEqual(['data/a.yml', 'data/b.yml']);
    expect(entries).toEqual([
      { file: { path: 'data/a.yml', label: 'A', id: null }, data: '' },
      { file: { path: 'data/b.yml' }, data: 'b: 1' },
    ]);
  });
});

describe('TurboContentCache getEntry', () => {
  const cached = { file: { path: 'posts/a.md' }, data: 'cached' };

  it('reads from the git host when the cache has no row', async () => {
    const fetch = syncAnswer({ fresh: true });
    const { cache } = makeCache({ fetch });
    const readFromHost = jest.fn().mockResolvedValue('host');

    await expect(cache.getEntry('posts/a.md', readFromHost)).resolves.toBe('host');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('trusts the cached row only once the server confirms it is current', async () => {
    const fetch = syncAnswer({ fresh: true });
    const { cache, supabase } = makeCache({ fetch });
    supabase.fetchEntryByPath.mockResolvedValue(cached);
    const readFromHost = jest.fn().mockResolvedValue('host');

    await expect(cache.getEntry('posts/a.md', readFromHost)).resolves.toBe(cached);

    expect(readFromHost).not.toHaveBeenCalled();
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${apiRoot}/_content/entry`);
    expect(JSON.parse(init.body)).toEqual({ path: 'posts/a.md', branch: 'main' });
  });

  it('reads from the git host when the row is stale', async () => {
    const { cache, supabase } = makeCache({ fetch: syncAnswer({ fresh: false }) });
    supabase.fetchEntryByPath.mockResolvedValue(cached);
    const readFromHost = jest.fn().mockResolvedValue('host');

    await expect(cache.getEntry('posts/a.md', readFromHost)).resolves.toBe('host');
  });

  it('reads from the git host when the freshness check cannot be made', async () => {
    // Costs requests, where trusting the cache costs edits.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { cache, supabase } = makeCache({
      fetch: jest.fn().mockRejectedValue(new Error('offline')),
      host: 'GitLab',
    });
    supabase.fetchEntryByPath.mockResolvedValue(cached);
    const readFromHost = jest.fn().mockResolvedValue('host');

    await expect(cache.getEntry('posts/a.md', readFromHost)).resolves.toBe('host');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('reading from GitLab'),
      expect.anything(),
    );
    warn.mockRestore();
  });
});
