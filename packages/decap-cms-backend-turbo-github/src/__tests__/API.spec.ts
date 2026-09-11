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
    json: () =>
      Promise.resolve({ sha, url: `https://github.com/acme/site/commit/${sha}`, branch: 'main' }),
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
    // No `asset` flag on a data file — it is what the server counts toward
    // "every content path was already cached", which is what lets it advance
    // the collection's ingest marker.
    expect('asset' in JSON.parse(init.body).additions[0]).toBe(false);
  });

  it("uses an asset proxy's own toBase64 rather than re-encoding raw", async () => {
    const turboFetch = committed();
    const asset = { path: '/static/img/a.png', toBase64: jest.fn().mockResolvedValue('QUJD') };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await makeApi(turboFetch).persistFiles([dataFile] as any, [asset] as any, options as any);

    expect(asset.toBase64).toHaveBeenCalled();
    // Media first, matching the REST path's mediaFiles.concat(dataFiles), the
    // leading slash stripped, and media flagged so the server keeps it out of
    // the content cache.
    expect(JSON.parse(turboFetch.mock.calls[0][1].body).additions).toEqual([
      { path: 'static/img/a.png', contents: 'QUJD', asset: true },
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

  function workflowCommitted({ complete = true, prNumber = 7 } = {}) {
    return jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          sha: 'b'.repeat(40),
          url: 'https://github.com/acme/site/commit/bbb',
          branch: 'cms/posts/hello',
          workflow: { complete, pull_request: prNumber ? { number: prNumber } : null },
        }),
    });
  }

  it('commits a first editorial-workflow save through the endpoint', async () => {
    const turboFetch = workflowCommitted();
    await makeApi(turboFetch).persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [dataFile] as any,
      [] as any,
      { ...options, useWorkflow: true, collectionName: 'posts', status: 'draft' } as any,
    );

    expect(restPersist).not.toHaveBeenCalled();
    expect(turboFetch).toHaveBeenCalledTimes(1);

    const body = JSON.parse(turboFetch.mock.calls[0][1].body);
    // The entry's own branch, not the site's — a workflow save must not publish.
    expect(body.branch).toBe('cms/posts/hello');
    expect(body.workflow).toEqual({
      status: 'draft',
      label_prefix: undefined,
      pull_request_title: 'Update Posts "hello"',
      pull_request_body: 'Automatically generated by Decap CMS',
    });
  });

  it('sends the initial workflow status when the save does not name one', async () => {
    const turboFetch = workflowCommitted();
    const api = makeApi(turboFetch);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any).initialWorkflowStatus = 'pending_review';

    await api.persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [dataFile] as any,
      [] as any,
      { ...options, useWorkflow: true, collectionName: 'posts' } as any,
    );

    expect(JSON.parse(turboFetch.mock.calls[0][1].body).workflow.status).toBe('pending_review');
  });

  // A rebase against the entry's own branch, and working out which media to
  // drop from a diff — a different operation, not a commit with extra steps.
  it('leaves a save of an already-unpublished entry on the REST path', async () => {
    const turboFetch = workflowCommitted();
    await makeApi(turboFetch).persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [dataFile] as any,
      [] as any,
      { ...options, useWorkflow: true, unpublished: true, collectionName: 'posts' } as any,
    );

    expect(turboFetch).not.toHaveBeenCalled();
    expect(restPersist).toHaveBeenCalled();
  });

  it('leaves open authoring on the REST path', async () => {
    const turboFetch = workflowCommitted();
    const api = makeApi(turboFetch);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any).useOpenAuthoring = true;

    await api.persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [dataFile] as any,
      [] as any,
      { ...options, useWorkflow: true, collectionName: 'posts' } as any,
    );

    expect(turboFetch).not.toHaveBeenCalled();
    expect(restPersist).toHaveBeenCalled();
  });

  it('finishes an incomplete workflow save over REST without committing again', async () => {
    const turboFetch = workflowCommitted({ complete: false, prNumber: 7 });
    const api = makeApi(turboFetch);
    const createPR = jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(api as any, 'createPR')
      .mockResolvedValue({ number: 7, labels: [] } as never);
    const updateStatus = jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(api as any, 'updateUnpublishedEntryStatus')
      .mockResolvedValue(undefined as never);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await api.persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [dataFile] as any,
      [] as any,
      { ...options, useWorkflow: true, collectionName: 'posts', status: 'draft' } as any,
    );

    // The commit already landed: re-running it would upload every blob again
    // and add a second, identical commit.
    expect(restPersist).not.toHaveBeenCalled();
    // The pull request already exists, so only the label is redone.
    expect(createPR).not.toHaveBeenCalled();
    expect(updateStatus).toHaveBeenCalledWith('posts', 'hello', 'draft');
  });

  it('opens the pull request too when the server could not', async () => {
    const turboFetch = workflowCommitted({ complete: false, prNumber: 0 });
    const api = makeApi(turboFetch);
    const createPR = jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(api as any, 'createPR')
      .mockResolvedValue({ number: 9, labels: [] } as never);
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(api as any, 'updateUnpublishedEntryStatus')
      .mockResolvedValue(undefined as never);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await api.persistFiles(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [dataFile] as any,
      [] as any,
      { ...options, useWorkflow: true, collectionName: 'posts' } as any,
    );

    expect(createPR).toHaveBeenCalledWith('Update Posts "hello"', 'cms/posts/hello');
    expect(restPersist).not.toHaveBeenCalled();
  });

  // 404 = edge function predates the endpoint; 400 and 413 = rejected by
  // request validation, before any GitHub call. All three prove nothing was
  // committed, so retrying cannot double-commit — and 400 is what lets a
  // bundle ship ahead of the edge function that understands its requests.
  it.each([400, 404, 413])('falls back to REST on %i', async status => {
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
