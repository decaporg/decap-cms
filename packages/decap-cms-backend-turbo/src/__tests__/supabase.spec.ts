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

  describe('insertDbFilesBatch', () => {
    it('deduplicates rows sharing the same site/repo/branch/collection/path', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('[]'),
      });

      await client.insertDbFilesBatch([
        { collection: 'posts', fileId: 'id-1', filePath: 'a.md', fileMeta: {}, fileData: 'old' },
        { collection: 'posts', fileId: 'id-2', filePath: 'a.md', fileMeta: {}, fileData: 'new' },
        { collection: 'posts', fileId: 'id-3', filePath: 'b.md', fileMeta: {}, fileData: 'b' },
      ]);

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body).toHaveLength(2);
      expect(body.map((row: any) => row.file_path)).toEqual(['a.md', 'b.md']);
      // First occurrence wins.
      expect(body[0].file_data).toBe('old');
    });

    it('keeps rows with the same path in different collections distinct', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('[]'),
      });

      await client.insertDbFilesBatch([
        { collection: 'posts', fileId: 'id-1', filePath: 'a.md', fileMeta: {}, fileData: 'posts' },
        { collection: 'pages', fileId: 'id-2', filePath: 'a.md', fileMeta: {}, fileData: 'pages' },
      ]);

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body).toHaveLength(2);
    });

    it('sends the on_conflict target matching the DB unique index', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('[]'),
      });

      await client.insertDbFilesBatch([
        { collection: 'posts', fileId: 'id-1', filePath: 'a.md', fileMeta: {}, fileData: 'x' },
      ]);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('on_conflict=site_id,repo,branch,collection,file_path');
    });

    it('throws when the batch insert fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'invalid batch' }),
      });

      await expect(
        client.insertDbFilesBatch([
          { collection: 'posts', fileId: 'id-1', filePath: 'a.md', fileMeta: {}, fileData: 'x' },
        ]),
      ).rejects.toThrow('Supabase request failed: invalid batch');
    });
  });

  describe('validateFiles', () => {
    it('removes cached rows for files no longer present on GitHub', async () => {
      global.fetch = jest
        .fn()
        // fetchDbFiles page
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify([{ file_id: 'stale-id' }])),
        })
        // fetchDbFiles pagination terminator (short page already returned above)
        // removeDbFiles delete call
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

      const readFile = jest.fn();
      const readFileMetadata = jest.fn();

      await client.validateFiles('posts', [], readFile, readFileMetadata);

      const deleteCall = (global.fetch as jest.Mock).mock.calls.find(
        ([, init]) => init?.method === 'DELETE',
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall[0]).toContain('file_id=in.%28%22stale-id%22%29');
      expect(readFile).not.toHaveBeenCalled();
    });

    it('reads and inserts files missing from the cache', async () => {
      global.fetch = jest
        .fn()
        // fetchDbFiles: nothing cached yet
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('[]') })
        // insertDbFilesBatch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('[]') });

      const readFile = jest.fn().mockResolvedValue('file contents');
      const readFileMetadata = jest.fn().mockResolvedValue({ sha: 'abc' });
      const files = [{ type: 'blob', id: 'new-id', name: 'a.md', path: 'a.md', size: 10 }];

      await client.validateFiles('posts', files, readFile, readFileMetadata);

      expect(readFile).toHaveBeenCalledWith('a.md', 'new-id', { parseText: true });
      expect(readFileMetadata).toHaveBeenCalledWith('a.md', 'new-id');

      const insertCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url]) => typeof url === 'string' && url.includes('on_conflict'),
      );
      expect(insertCall).toBeDefined();
      const body = JSON.parse(insertCall[1].body);
      expect(body[0]).toMatchObject({ file_id: 'new-id', file_path: 'a.md', file_data: 'file contents' });
    });

    it('does nothing when the cache already matches the file list', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ file_id: 'same-id' }])),
      });

      const readFile = jest.fn();
      const readFileMetadata = jest.fn();
      const files = [{ type: 'blob', id: 'same-id', name: 'a.md', path: 'a.md', size: 10 }];

      await client.validateFiles('posts', files, readFile, readFileMetadata);

      expect(readFile).not.toHaveBeenCalled();
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([, init]) => init?.method === 'DELETE'),
      ).toBe(false);
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

  describe('updateEntriesAfterSave', () => {
    it('skips files that have no existing cached row', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('[]') });

      await client.updateEntriesAfterSave([{ path: 'a.md', raw: 'content', id: 'id-1' }]);

      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          typeof url === 'string' ? url.includes('on_conflict') : false,
        ),
      ).toBe(false);
    });

    it('re-inserts existing rows with refreshed content and metadata', async () => {
      global.fetch = jest
        .fn()
        // lookup for a.md
        .mockResolvedValueOnce({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify([{ collection: 'posts', file_meta: { sha: 'old-sha' } }]),
            ),
        })
        // insertDbFilesBatch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('[]') });

      await client.updateEntriesAfterSave([{ path: 'a.md', raw: 'new content', id: 'id-1' }]);

      const insertCall = (global.fetch as jest.Mock).mock.calls[1];
      const body = JSON.parse(insertCall[1].body);
      expect(body[0]).toMatchObject({
        collection: 'posts',
        file_id: 'id-1',
        file_path: 'a.md',
        file_data: 'new content',
      });
      expect(body[0].file_meta).toMatchObject({ sha: 'old-sha', id: 'id-1', path: 'a.md' });
    });
  });
});
