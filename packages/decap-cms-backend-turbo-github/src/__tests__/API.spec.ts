// Package root, not the deep `src/API` path — see the note in ../API.ts.
import { API } from 'decap-cms-backend-github';

import TurboAPI from '../API';

function makeApi(turboFetch: jest.Mock) {
  return new TurboAPI({
    apiRoot: 'https://sb.example.com/functions/v1/gh',
    branch: 'main',
    repo: 'acme/site',
    originRepo: 'acme/site',
    token: 'supabase-jwt',
    turboFetch,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

function committed(sha = 'a'.repeat(40)) {
  return jest.fn().mockResolvedValue({
    json: () => Promise.resolve({ sha, url: `https://github.com/acme/site/commit/${sha}`, branch: 'main' }),
  });
}

function failingWith(status: number) {
  const error = new Error(`request failed with ${status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error as any).status = status;
  return jest.fn().mockRejectedValue(error);
}

const dataFile = { path: 'content/posts/hello.md', slug: 'hello', raw: 'hello' };
const options = { commitMessage: 'Update Posts "hello"' };

describe('TurboAPI.persistFiles', () => {
  let restPersist: jest.SpyInstance;

  beforeEach(() => {
    restPersist = jest.spyOn(API.prototype, 'persistFiles').mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('commits everything in a single request, with base64 contents', async () => {
    const turboFetch = committed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await makeApi(turboFetch).persistFiles([dataFile] as any, [] as any, options as any);

    expect(turboFetch).toHaveBeenCalledTimes(1);
    expect(restPersist).not.toHaveBeenCalled();

    const [url, init] = turboFetch.mock.calls[0];
    expect(url).toBe('https://sb.example.com/functions/v1/gh/_content/commit');
    expect(JSON.parse(init.body)).toEqual({
      branch: 'main',
      message: 'Update Posts "hello"',
      additions: [{ path: 'content/posts/hello.md', contents: 'aGVsbG8=' }],
    });
  });

  it('uses an asset proxy\'s own toBase64 rather than re-encoding raw', async () => {
    const turboFetch = committed();
    const asset = { path: '/static/img/a.png', toBase64: jest.fn().mockResolvedValue('QUJD') };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await makeApi(turboFetch).persistFiles([dataFile] as any, [asset] as any, options as any);

    expect(asset.toBase64).toHaveBeenCalled();
    // Media first, matching the REST path's mediaFiles.concat(dataFiles), and
    // the leading slash stripped.
    expect(JSON.parse(turboFetch.mock.calls[0][1].body).additions).toEqual([
      { path: 'static/img/a.png', contents: 'QUJD' },
      { path: 'content/posts/hello.md', contents: 'aGVsbG8=' },
    ]);
  });

  // A rename is a directory move that relocates sibling files by blob sha,
  // whose contents this path never holds — not expressible as a commit of
  // contents, so it must go the REST way.
  it('falls back to REST for a rename', async () => {
    const turboFetch = committed();
    await makeApi(turboFetch).persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [{ ...dataFile, newPath: 'content/posts/renamed.md' }] as any,
      [] as any,
      options as any,
    );

    expect(turboFetch).not.toHaveBeenCalled();
    expect(restPersist).toHaveBeenCalled();
  });

  it('falls back to REST for the editorial workflow', async () => {
    const turboFetch = committed();
    await makeApi(turboFetch).persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [dataFile] as any,
      [] as any,
      { ...options, useWorkflow: true } as any,
    );

    expect(turboFetch).not.toHaveBeenCalled();
    expect(restPersist).toHaveBeenCalled();
  });

  // 404 = edge function predates the endpoint, 413 = rejected in validation.
  // Both prove nothing was committed, so retrying cannot double-commit.
  it.each([404, 413])('falls back to REST on %i', async status => {
    const turboFetch = failingWith(status);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await makeApi(turboFetch).persistFiles([dataFile] as any, [] as any, options as any);

    expect(turboFetch).toHaveBeenCalledTimes(1);
    expect(restPersist).toHaveBeenCalled();
  });

  // A 5xx or a dropped connection could mean the commit landed and the reply
  // was lost. Retrying that would commit the same entry twice.
  it.each([500, 502, 403])('surfaces %i instead of retrying on REST', async status => {
    const turboFetch = failingWith(status);

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeApi(turboFetch).persistFiles([dataFile] as any, [] as any, options as any),
    ).rejects.toThrow();
    expect(restPersist).not.toHaveBeenCalled();
  });
});

describe('TurboAPI.deleteFiles', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deletes in a single request', async () => {
    const turboFetch = committed();
    await makeApi(turboFetch).deleteFiles(['/content/posts/gone.md'], 'Delete gone');

    expect(JSON.parse(turboFetch.mock.calls[0][1].body)).toEqual({
      branch: 'main',
      message: 'Delete gone',
      deletions: ['content/posts/gone.md'],
    });
  });

  it('falls back to REST on 404', async () => {
    const restDelete = jest.spyOn(API.prototype, 'deleteFiles').mockResolvedValue(undefined);
    await makeApi(failingWith(404)).deleteFiles(['a.md'], 'Delete a');

    expect(restDelete).toHaveBeenCalledWith(['a.md'], 'Delete a');
  });
});
