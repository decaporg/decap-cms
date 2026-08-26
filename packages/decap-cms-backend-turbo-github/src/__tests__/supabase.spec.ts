import { SupabaseClient } from '../supabase';

function mockPaginatedFetch(pages: any[][]) {
  let call = 0;
  return jest.fn().mockImplementation(() => {
    const page = pages[call] ?? [];
    call += 1;
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(page)),
    });
  });
}

describe('SupabaseClient', () => {
  const supabaseUrl = 'https://example.supabase.co/rest/v1/data';
  const anonKey = 'anon-key';
  const branch = 'main';
  const repo = 'owner/repo';
  const siteId = 'site-123';

  let client: SupabaseClient;

  beforeEach(() => {
    client = new SupabaseClient(supabaseUrl, anonKey, branch, repo, siteId);
  });

  describe('fetchDbPaginated', () => {
    it('follows Range pagination until a short page is returned', async () => {
      const fullPage = Array.from({ length: 2 }, (_, i) => ({ file_id: `id-${i}` }));
      const shortPage = [{ file_id: 'id-last' }];
      global.fetch = mockPaginatedFetch([fullPage, shortPage]);

      const results = await client.fetchDbPaginated('?repo=eq.owner/repo', 2);

      expect(results).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const [, firstInit] = (global.fetch as jest.Mock).mock.calls[0];
      expect(firstInit.headers.Range).toBe('0-1');
      const [, secondInit] = (global.fetch as jest.Mock).mock.calls[1];
      expect(secondInit.headers.Range).toBe('2-3');
    });

    it('stops after a single page when fewer than batchSize rows are returned', async () => {
      global.fetch = mockPaginatedFetch([[{ file_id: 'only-one' }]]);

      const results = await client.fetchDbPaginated('?repo=eq.owner/repo', 500);

      expect(results).toEqual([{ file_id: 'only-one' }]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('throws when a page request fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'boom' }),
      });

      await expect(client.fetchDbPaginated('?repo=eq.owner/repo')).rejects.toThrow(
        'Supabase request failed: boom',
      );
    });
  });




  describe('buildScopedQuery', () => {
    it('filters by collections set membership, not a collection column', () => {
      const query = client.buildScopedQuery('posts:md:1:all');
      const params = new URLSearchParams(query.slice(1));
      expect(params.get('collections')).toBe('cs.{"posts:md:1:all"}');
      expect(params.get('collection')).toBeNull();
    });

    it('scopes every query by site, repo and branch', () => {
      const params = new URLSearchParams(client.buildScopedQuery('k').slice(1));
      expect(params.get('site_id')).toBe(`eq.${siteId}`);
      expect(params.get('repo')).toBe(`eq.${repo}`);
      expect(params.get('branch')).toBe(`eq.${branch}`);
    });

    it('quotes a collection key containing commas and braces so the array literal stays intact', () => {
      // Collection keys embed a stringified regex, which can contain both.
      const params = new URLSearchParams(client.buildScopedQuery('c:md:1:/a{1,2}/').slice(1));
      expect(params.get('collections')).toBe('cs.{"c:md:1:/a{1,2}/"}');
    });

    it('merges extra params such as the search filter', () => {
      const params = new URLSearchParams(
        client.buildScopedQuery('k', { file_data: 'ilike.%needle%' }).slice(1),
      );
      expect(params.get('file_data')).toBe('ilike.%needle%');
    });
  });

  describe('write surface', () => {
    it('exposes no cache-write methods — the server owns the cache', () => {
      for (const removed of [
        'validateFiles',
        'insertDbFile',
        'insertDbFilesBatch',
        'removeDbFiles',
        'updateEntriesAfterSave',
        'fetchDbFiles',
      ]) {
        expect((client as any)[removed]).toBeUndefined();
      }
    });
  });

  describe('fetchEntryByPath', () => {
    it('returns null when no cached row matches the path', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('[]') });

      const result = await client.fetchEntryByPath('missing.md');

      expect(result).toBeNull();
    });

    it('maps the first matching row to file/data', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify([{ file_meta: { id: 'id-1' }, file_data: 'hello world' }]),
          ),
      });

      const result = await client.fetchEntryByPath('a.md');

      expect(result).toEqual({ file: { id: 'id-1' }, data: 'hello world' });
    });
  });

});
