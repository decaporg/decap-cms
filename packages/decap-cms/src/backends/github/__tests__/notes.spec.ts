/**
 * Editor notes on the GitHub backend, at the HTTP boundary: which requests go
 * out to find, create, read and change an entry's notes issue, and what comes
 * back. `fetch` is the only thing stubbed, so the real request, paging and
 * ETag plumbing runs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import API from '@/backends/github/API';
import GitHubImplementation from '@/backends/github/implementation';
import { formatNoteBody } from '@/lib/backend/index';

const API_ROOT = 'https://api.github.com';
const REPO = 'owner/repo';

type Reply = (request: { url: URL, init: RequestInit, body: any }) => Response | Promise<Response>;
type Route = { method: string, path: string | RegExp, reply: Reply };

function json(body: unknown, init: { status?: number, headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...init.headers },
  });
}

/** Routes `fetch` by method and path; an unrouted request fails the test. */
function mockFetch(routes: Route[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const method = init.method || 'GET';
    const route = routes.find(r =>
      r.method === method && (typeof r.path === 'string' ? r.path === url.pathname : r.path.test(url.pathname))
    );
    if (!route) {
      throw new Error(`Unexpected request: ${method} ${url}`);
    }
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    return route.reply({ url, init, body });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function requestsTo(fetchMock: ReturnType<typeof mockFetch>, method: string, path: string) {
  return fetchMock.mock.calls.filter(([input, init = {}]) =>
    (init.method || 'GET') === method && new URL(String(input)).pathname === path
  );
}

function issue(number: number, key: string, overrides: Record<string, unknown> = {}) {
  return {
    id: number * 100,
    number,
    title: `Notes: ${key}`,
    body:
      `This issue tracks notes for entry: \`${key}\`\n\n---\n*This issue was created automatically by Decap CMS for note management.*`,
    state: 'open',
    comments: 0,
    html_url: `https://github.com/${REPO}/issues/${number}`,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    user: { login: 'ada', avatar_url: 'https://avatars/ada' },
    labels: [{ name: 'decap-cms-notes', color: 'ededed' }, { name: 'collection:posts', color: 'ededed' }],
    ...overrides,
  };
}

function comment(id: number, body: string, login = 'ada') {
  return {
    id,
    body,
    user: { login, avatar_url: `https://avatars/${login}` },
    created_at: `2026-01-0${id}T00:00:00Z`,
    updated_at: `2026-01-0${id}T00:00:00Z`,
    html_url: `https://github.com/${REPO}/issues/1#issuecomment-${id}`,
  };
}

function searchRoute(items: unknown[] | ((q: string) => unknown[])): Route {
  return {
    method: 'GET',
    path: '/search/issues',
    reply: ({ url }) => {
      const q = url.searchParams.get('q')!;
      return json({ total_count: 0, items: typeof items === 'function' ? items(q) : items });
    },
  };
}

function newAPI() {
  return new API({ repo: REPO, token: 'secret', branch: 'main' } as any);
}

describe('github notes API', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findEntryIssue', () => {
    it('searches the repo for the labelled issue that names the entry', async () => {
      const fetchMock = mockFetch([searchRoute([issue(4, 'posts/my-post')])]);

      await expect(newAPI().findEntryIssue('posts', 'my-post')).resolves.toEqual({
        number: 4,
        html_url: `https://github.com/${REPO}/issues/4`,
      });

      const [[input, init]] = fetchMock.mock.calls;
      expect(new URL(String(input)).searchParams.get('q')).toBe(
        'repo:owner/repo label:decap-cms-notes "posts/my-post" in:body',
      );
      expect((init!.headers as Record<string, string>).Authorization).toBe('token secret');
    });

    // Search matches the quoted key as a phrase, so a longer slug that starts
    // the same comes back too - and may rank first.
    it('accepts only the issue whose body names exactly this entry', async () => {
      mockFetch([searchRoute([issue(5, 'posts/my-post-2'), issue(4, 'posts/my-post')])]);

      await expect(newAPI().findEntryIssue('posts', 'my-post')).resolves.toMatchObject({ number: 4 });
    });

    it('answers null when only a lookalike entry has a thread', async () => {
      mockFetch([searchRoute([issue(5, 'posts/my-post-2')])]);

      await expect(newAPI().findEntryIssue('posts', 'my-post')).resolves.toBeNull();
    });

    it('remembers the thread instead of searching again', async () => {
      const fetchMock = mockFetch([searchRoute([issue(4, 'posts/my-post')])]);
      const api = newAPI();

      await api.findEntryIssue('posts', 'my-post');
      await api.findEntryIssue('posts', 'my-post');

      expect(requestsTo(fetchMock, 'GET', '/search/issues')).toHaveLength(1);
    });

    it('forgets remembered threads on reset', async () => {
      const fetchMock = mockFetch([searchRoute([issue(4, 'posts/my-post')])]);
      const api = newAPI();

      await api.findEntryIssue('posts', 'my-post');
      api.reset();
      await api.findEntryIssue('posts', 'my-post');

      expect(requestsTo(fetchMock, 'GET', '/search/issues')).toHaveLength(2);
    });

    // Read as "no thread", a failed lookup would make the next note open a
    // second issue for the same entry.
    it('throws when the search fails instead of answering null', async () => {
      mockFetch([
        { method: 'GET', path: '/search/issues', reply: () => json({ message: 'Validation Failed' }, { status: 422 }) },
      ]);

      await expect(newAPI().findEntryIssue('posts', 'my-post')).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('createEntryIssue', () => {
    it('opens a labelled issue titled after the entry', async () => {
      let created: any;
      const fetchMock = mockFetch([
        {
          method: 'POST',
          path: `/repos/${REPO}/issues`,
          reply: ({ body }) => {
            created = body;
            return json(issue(9, 'posts/my-post'), { status: 201 });
          },
        },
      ]);
      const api = newAPI();

      await api.createEntryIssue('posts', 'my-post', 'My Post');

      expect(created).toEqual({
        title: 'Notes: My Post',
        body: expect.stringContaining('This issue tracks notes for entry: `posts/my-post`'),
        labels: ['decap-cms-notes', 'collection:posts'],
      });
      // Search would not see the new issue for a while; the next lookup must.
      await expect(api.findEntryIssue('posts', 'my-post')).resolves.toMatchObject({ number: 9 });
      expect(requestsTo(fetchMock, 'GET', '/search/issues')).toHaveLength(0);
    });

    it('falls back to collection/slug for the title', async () => {
      let created: any;
      mockFetch([
        {
          method: 'POST',
          path: `/repos/${REPO}/issues`,
          reply: ({ body }) => {
            created = body;
            return json(issue(9, 'posts/my-post'), { status: 201 });
          },
        },
      ]);

      await newAPI().createEntryIssue('posts', 'my-post');

      expect(created.title).toBe('Notes: posts/my-post');
    });
  });

  describe('getIssueWithETag', () => {
    const issueRoute = (reply: Reply): Route => ({ method: 'GET', path: `/repos/${REPO}/issues/4`, reply });

    it('answers 304 without reading comments when the issue is unchanged', async () => {
      const fetchMock = mockFetch([issueRoute(() => new Response(null, { status: 304 }))]);

      await expect(newAPI().getIssueWithETag(4, 'W/"abc"')).resolves.toEqual({ status: 304 });

      const [[input, init]] = fetchMock.mock.calls;
      expect(String(input)).toBe(`${API_ROOT}/repos/${REPO}/issues/4`);
      expect(init!.headers).toMatchObject({ 'If-None-Match': 'W/"abc"', Authorization: 'token secret' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('sends no If-None-Match on a first read', async () => {
      const fetchMock = mockFetch([
        issueRoute(() => json(issue(4, 'posts/my-post'), { headers: { ETag: 'W/"one"' } })),
        { method: 'GET', path: `/repos/${REPO}/issues/4/comments`, reply: () => json([]) },
      ]);

      await newAPI().getIssueWithETag(4, null);

      expect(fetchMock.mock.calls[0][1]!.headers).not.toHaveProperty('If-None-Match');
    });

    it('returns the issue, every page of its comments and the new ETag', async () => {
      const fetchMock = mockFetch([
        issueRoute(() => json(issue(4, 'posts/my-post'), { headers: { ETag: 'W/"two"' } })),
        {
          method: 'GET',
          path: `/repos/${REPO}/issues/4/comments`,
          reply: ({ url }) =>
            url.searchParams.get('page') === '2'
              ? json([comment(3, 'third')])
              : json([comment(1, 'first'), comment(2, 'second')], {
                headers: { Link: `<${API_ROOT}/repos/${REPO}/issues/4/comments?per_page=100&page=2>; rel="next"` },
              }),
        },
      ]);

      const result = await newAPI().getIssueWithETag(4, 'W/"one"');

      expect(result).toEqual({
        status: 200,
        etag: 'W/"two"',
        data: {
          number: 4,
          title: 'Notes: posts/my-post',
          body: expect.stringContaining('`posts/my-post`'),
          state: 'open',
          updated_at: '2026-01-01T00:00:00Z',
          labels: issue(4, 'posts/my-post').labels,
          html_url: `https://github.com/${REPO}/issues/4`,
          comments: [1, 2, 3].map(id => ({
            id,
            body: ['first', 'second', 'third'][id - 1],
            user: { login: 'ada', avatar_url: 'https://avatars/ada' },
            created_at: `2026-01-0${id}T00:00:00Z`,
            updated_at: `2026-01-0${id}T00:00:00Z`,
          })),
        },
      });
      const commentRequests = requestsTo(fetchMock, 'GET', `/repos/${REPO}/issues/4/comments`);
      expect(commentRequests).toHaveLength(2);
      expect(new URL(String(commentRequests[0][0])).searchParams.get('per_page')).toBe('100');
    });

    // A failed comment read must not look like a thread with every note deleted.
    it('throws when the comments cannot be read', async () => {
      mockFetch([
        issueRoute(() => json(issue(4, 'posts/my-post'))),
        {
          method: 'GET',
          path: `/repos/${REPO}/issues/4/comments`,
          reply: () => json({ message: 'Server Error' }, { status: 500 }),
        },
      ]);

      await expect(newAPI().getIssueWithETag(4, null)).rejects.toThrow('Server Error');
    });

    it('throws on any other status', async () => {
      mockFetch([issueRoute(() => json({ message: 'Not Found' }, { status: 404 }))]);

      await expect(newAPI().getIssueWithETag(4, null)).rejects.toMatchObject({ status: 404 });
    });

    // A subclass scoping requests to its own proxy must see this one too.
    it('builds the request through urlFor and requestHeaders', async () => {
      const fetchMock = mockFetch([
        {
          method: 'GET',
          path: '/proxy/repos/owner/repo/issues/4',
          reply: () => new Response(null, { status: 304 }),
        },
      ]);
      const api = newAPI();
      api.urlFor = (path: string) => `https://proxy.example/proxy${path}`;
      api.requestHeaders = async (headers = {}) => ({ ...headers, 'X-Proxy': 'yes' });

      await api.getIssueWithETag(4, 'W/"abc"');

      expect(fetchMock.mock.calls[0][1]!.headers).toEqual({ 'If-None-Match': 'W/"abc"', 'X-Proxy': 'yes' });
    });

    it('getIssueState reads the issue unconditionally', async () => {
      mockFetch([
        issueRoute(() => json(issue(4, 'posts/my-post'))),
        { method: 'GET', path: `/repos/${REPO}/issues/4/comments`, reply: () => json([comment(1, 'first')]) },
      ]);

      await expect(newAPI().getIssueState(4)).resolves.toMatchObject({ number: 4, comments: [{ id: 1 }] });
    });
  });

  describe('getEntryNotes', () => {
    it('has no notes when the entry has no thread', async () => {
      const fetchMock = mockFetch([searchRoute([])]);

      await expect(newAPI().getEntryNotes('posts', 'my-post')).resolves.toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('reads each comment as a note linked to the thread', async () => {
      mockFetch([
        searchRoute([issue(4, 'posts/my-post')]),
        {
          method: 'GET',
          path: `/repos/${REPO}/issues/4/comments`,
          reply: () =>
            json([
              comment(1, formatNoteBody({ content: 'Check the intro', resolved: true })),
              comment(2, 'typed on GitHub', 'grace'),
            ]),
        },
      ]);

      const notes = await newAPI().getEntryNotes('posts', 'my-post');

      expect(notes).toEqual([
        {
          id: '1',
          author: 'ada',
          authorId: undefined,
          avatarUrl: 'https://avatars/ada',
          timestamp: '2026-01-01T00:00:00Z',
          content: 'Check the intro',
          resolved: true,
          entrySlug: '',
          issueUrl: `https://github.com/${REPO}/issues/4`,
        },
        expect.objectContaining({ id: '2', author: 'grace', content: 'typed on GitHub', resolved: false }),
      ]);
    });

    it('propagates a failed read', async () => {
      mockFetch([
        { method: 'GET', path: '/search/issues', reply: () => json({ message: 'Server Error' }, { status: 500 }) },
      ]);

      await expect(newAPI().getEntryNotes('posts', 'my-post')).rejects.toThrow('Server Error');
    });
  });

  describe('addNoteToEntry', () => {
    const note = {
      id: 'temp-1',
      content: 'Tighten the headline',
      resolved: false,
      author: 'ada',
      timestamp: '2026-01-01T00:00:00Z',
      entrySlug: 'my-post',
    };

    it('posts the note on the existing thread', async () => {
      let posted: any;
      const fetchMock = mockFetch([
        searchRoute([issue(4, 'posts/my-post')]),
        {
          method: 'POST',
          path: `/repos/${REPO}/issues/4/comments`,
          reply: ({ body }) => {
            posted = body;
            return json(comment(7, body.body), { status: 201 });
          },
        },
      ]);

      await expect(newAPI().addNoteToEntry('posts', 'my-post', note, 'My Post')).resolves.toEqual({
        commentId: '7',
        issueUrl: `https://github.com/${REPO}/issues/4`,
      });
      expect(posted).toEqual({ body: formatNoteBody(note) });
      expect(requestsTo(fetchMock, 'POST', `/repos/${REPO}/issues`)).toHaveLength(0);
    });

    it("opens the thread for the entry's first note", async () => {
      let created: any;
      mockFetch([
        searchRoute([]),
        {
          method: 'POST',
          path: `/repos/${REPO}/issues`,
          reply: ({ body }) => {
            created = body;
            return json(issue(9, 'posts/my-post'), { status: 201 });
          },
        },
        {
          method: 'POST',
          path: `/repos/${REPO}/issues/9/comments`,
          reply: ({ body }) => json(comment(8, body.body), { status: 201 }),
        },
      ]);

      await expect(newAPI().addNoteToEntry('posts', 'my-post', note, 'My Post')).resolves.toEqual({
        commentId: '8',
        issueUrl: `https://github.com/${REPO}/issues/9`,
      });
      expect(created.title).toBe('Notes: My Post');
    });

    it('posts a second note to the thread the first one opened', async () => {
      const fetchMock = mockFetch([
        // Search has not indexed the new issue yet.
        searchRoute([]),
        {
          method: 'POST',
          path: `/repos/${REPO}/issues`,
          reply: () => json(issue(9, 'posts/my-post'), { status: 201 }),
        },
        {
          method: 'POST',
          path: `/repos/${REPO}/issues/9/comments`,
          reply: ({ body }) => json(comment(8, body.body), { status: 201 }),
        },
      ]);
      const api = newAPI();

      await api.addNoteToEntry('posts', 'my-post', note);
      await api.addNoteToEntry('posts', 'my-post', note);

      expect(requestsTo(fetchMock, 'POST', `/repos/${REPO}/issues`)).toHaveLength(1);
      expect(requestsTo(fetchMock, 'POST', `/repos/${REPO}/issues/9/comments`)).toHaveLength(2);
    });

    it('opens no thread when the lookup fails', async () => {
      const fetchMock = mockFetch([
        { method: 'GET', path: '/search/issues', reply: () => json({ message: 'Server Error' }, { status: 500 }) },
      ]);

      await expect(newAPI().addNoteToEntry('posts', 'my-post', note)).rejects.toMatchObject({
        message: 'Failed to create note: Server Error',
        status: 500,
      });
      expect(requestsTo(fetchMock, 'POST', `/repos/${REPO}/issues`)).toHaveLength(0);
    });
  });

  describe('updateEntryNote and deleteEntryNote', () => {
    const note = {
      id: '7',
      content: 'Tighten the headline',
      resolved: true,
      author: 'ada',
      timestamp: '2026-01-01T00:00:00Z',
      entrySlug: 'my-post',
    };

    it('rewrites the comment with the note re-encoded', async () => {
      let patched: any;
      mockFetch([
        {
          method: 'PATCH',
          path: `/repos/${REPO}/issues/comments/7`,
          reply: ({ body }) => {
            patched = body;
            return json(comment(7, body.body));
          },
        },
      ]);

      await newAPI().updateEntryNote('7', note);

      expect(patched).toEqual({ body: formatNoteBody(note) });
    });

    it('reports why an update failed', async () => {
      mockFetch([
        {
          method: 'PATCH',
          path: `/repos/${REPO}/issues/comments/7`,
          reply: () => json({ message: 'Resource not accessible by integration' }, { status: 403 }),
        },
      ]);

      await expect(newAPI().updateEntryNote('7', note)).rejects.toMatchObject({
        message: 'Failed to update note: Resource not accessible by integration',
        status: 403,
        api: 'GitHub',
      });
    });

    it('deletes the comment', async () => {
      const fetchMock = mockFetch([
        {
          method: 'DELETE',
          path: `/repos/${REPO}/issues/comments/7`,
          reply: () => new Response(null, { status: 204 }),
        },
      ]);

      await newAPI().deleteEntryNote('7');

      expect(requestsTo(fetchMock, 'DELETE', `/repos/${REPO}/issues/comments/7`)).toHaveLength(1);
    });

    it('reports why a delete failed', async () => {
      mockFetch([
        {
          method: 'DELETE',
          path: `/repos/${REPO}/issues/comments/7`,
          reply: () => json({ message: 'Not Found' }, { status: 404 }),
        },
      ]);

      await expect(newAPI().deleteEntryNote('7')).rejects.toMatchObject({
        message: 'Failed to delete note: Not Found',
        status: 404,
      });
    });
  });

  describe('thread lifecycle', () => {
    function patchRoute(onPatch: (body: any) => void): Route {
      return {
        method: 'PATCH',
        path: /^\/repos\/owner\/repo\/issues\/\d+$/,
        reply: ({ body }) => {
          onPatch(body);
          return json({});
        },
      };
    }

    it('closes the open thread on publish and labels it', async () => {
      let query = '';
      let patched: any;
      const fetchMock = mockFetch([
        searchRoute(q => {
          query = q;
          return [issue(4, 'posts/my-post')];
        }),
        patchRoute(body => (patched = body)),
      ]);

      await newAPI().closeIssueOnPublish('posts', 'my-post');

      expect(query).toBe('repo:owner/repo label:decap-cms-notes "posts/my-post" in:body state:open');
      expect(patched).toEqual({
        state: 'closed',
        labels: ['decap-cms-notes', 'collection:posts', 'entry-published'],
      });
      expect(requestsTo(fetchMock, 'PATCH', `/repos/${REPO}/issues/4`)).toHaveLength(1);
    });

    it('does not repeat a label the thread already has', async () => {
      let patched: any;
      mockFetch([
        searchRoute([
          issue(4, 'posts/my-post', {
            labels: [{ name: 'decap-cms-notes', color: '' }, { name: 'entry-published', color: '' }],
          }),
        ]),
        patchRoute(body => (patched = body)),
      ]);

      await newAPI().closeIssueOnPublish('posts', 'my-post');

      expect(patched.labels).toEqual(['decap-cms-notes', 'entry-published']);
    });

    it('closes the thread when the entry is deleted', async () => {
      let patched: any;
      mockFetch([searchRoute([issue(4, 'posts/my-post')]), patchRoute(body => (patched = body))]);

      await newAPI().closeEntryNotesIssue('posts', 'my-post');

      expect(patched).toEqual({
        state: 'closed',
        labels: ['decap-cms-notes', 'collection:posts', 'entry-deleted'],
      });
    });

    it('reopens the thread on unpublish and drops the lifecycle labels', async () => {
      let query = '';
      let patched: any;
      mockFetch([
        searchRoute(q => {
          query = q;
          return [
            issue(4, 'posts/my-post', {
              state: 'closed',
              labels: [
                { name: 'decap-cms-notes', color: '' },
                { name: 'entry-published', color: '' },
                { name: 'entry-deleted', color: '' },
              ],
            }),
          ];
        }),
        patchRoute(body => (patched = body)),
      ]);

      await newAPI().reopenIssueOnUnpublish('posts', 'my-post');

      expect(query).toBe('repo:owner/repo label:decap-cms-notes "posts/my-post" in:body');
      expect(patched).toEqual({ state: 'open', labels: ['decap-cms-notes'] });
    });

    it('leaves a lookalike entry’s thread alone', async () => {
      const fetchMock = mockFetch([searchRoute([issue(5, 'posts/my-post-2')]), patchRoute(() => {})]);

      await newAPI().closeIssueOnPublish('posts', 'my-post');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // It follows a publish that already happened; failing it would report the
    // publish as failed.
    it('only warns when the thread cannot be updated', async () => {
      mockFetch([
        searchRoute([issue(4, 'posts/my-post')]),
        {
          method: 'PATCH',
          path: `/repos/${REPO}/issues/4`,
          reply: () => json({ message: 'Forbidden' }, { status: 403 }),
        },
      ]);

      await expect(newAPI().closeIssueOnPublish('posts', 'my-post')).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith('Failed to close the notes issue:', expect.anything());
    });
  });
});

describe('github notes polling', () => {
  const config = {
    backend: { name: 'github', repo: REPO, branch: 'main', api_root: API_ROOT },
    collections: [{ name: 'posts', editor: { notes: true } }],
  };

  let backend: GitHubImplementation;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    backend?.logout();
    vi.restoreAllMocks();
  });

  function authRoutes(): Route[] {
    return [
      {
        method: 'GET',
        path: '/user',
        reply: () => json({ login: 'ada', name: 'Ada', avatar_url: 'https://avatars/ada' }),
      },
      {
        method: 'GET',
        path: `/repos/${REPO}`,
        reply: () => json({ owner: { login: 'owner' }, permissions: { push: true } }),
      },
    ];
  }

  it('authenticating sets up polling, and replaces a manager left from an earlier sign-in', async () => {
    mockFetch(authRoutes());
    backend = new GitHubImplementation(config as any);

    await backend.authenticate({ token: 'secret' });
    const first = backend.pollingManager!;
    const destroy = vi.spyOn(first, 'destroy');
    await backend.authenticate({ token: 'secret' });

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(backend.pollingManager).toBeDefined();
    expect(backend.pollingManager).not.toBe(first);

    backend.logout();
    expect(backend.pollingManager).toBeUndefined();
  });

  it("reports another editor's note, with ownership marked, once the thread changes", async () => {
    let comments = [comment(1, 'mine')];
    let etag = 'W/"one"';
    const fetchMock = mockFetch([
      ...authRoutes(),
      searchRoute([issue(4, 'posts/my-post')]),
      {
        method: 'GET',
        path: `/repos/${REPO}/issues/4`,
        reply: ({ init }) =>
          (init.headers as Record<string, string>)['If-None-Match'] === etag
            ? new Response(null, { status: 304 })
            : json(issue(4, 'posts/my-post'), { headers: { ETag: etag } }),
      },
      { method: 'GET', path: `/repos/${REPO}/issues/4/comments`, reply: () => json(comments) },
    ]);
    backend = new GitHubImplementation(config as any);
    await backend.authenticate({ token: 'secret' });

    const onUpdate = vi.fn();
    await backend.startNotesPolling('posts', 'my-post', { onUpdate });
    expect(backend.pollingManager!.getStatus().currentWatch).toBe('posts/my-post');
    // Watching reads the thread, then checks it once straight away; that check
    // stores the ETag.
    await vi.waitFor(() => expect(requestsTo(fetchMock, 'GET', `/repos/${REPO}/issues/4/comments`)).toHaveLength(2));
    await new Promise(resolve => setTimeout(resolve, 0));

    await backend.refreshNotesNow('posts', 'my-post');
    const reads = requestsTo(fetchMock, 'GET', `/repos/${REPO}/issues/4`);
    expect(reads).toHaveLength(3);
    expect(reads[2][1]!.headers).toMatchObject({ 'If-None-Match': 'W/"one"' });
    expect(onUpdate).not.toHaveBeenCalled();

    comments = [comment(1, 'mine'), comment(2, 'theirs', 'grace')];
    etag = 'W/"two"';
    await backend.refreshNotesNow('posts', 'my-post');

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [notes, changes] = onUpdate.mock.calls[0];
    expect(notes).toEqual([
      expect.objectContaining({ id: '1', author: 'ada', isOwn: true, issueUrl: `https://github.com/${REPO}/issues/4` }),
      expect.objectContaining({ id: '2', author: 'grace', isOwn: false }),
    ]);
    expect(changes).toEqual([expect.objectContaining({ type: 'comment_added' })]);

    await backend.stopNotesPolling('posts', 'my-post');
    expect(backend.pollingManager!.getStatus().currentWatch).toBeNull();
  });
});
