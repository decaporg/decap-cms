import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GitLabNotesAPI, noteIssueDescription } from '@/backends/gitlab/notesApi';
import { formatNoteBody } from '@/lib/backend/index';

import type { ApiRequest, ApiRequestObject } from '@/lib/util/index';

type Handler = (req: ApiRequestObject) => Promise<unknown>;
type RequestHandler = (req: ApiRequestObject) => Promise<Partial<Response>>;

/** String requests (a bare URL) are normalised so handlers can read `.url`,
 *  `.method` and `.params` without checking the shape first. */
function normalise(req: ApiRequest): ApiRequestObject {
  return typeof req === 'string' ? { url: req } : req;
}

function makeApi(handler: Handler, requestHandler?: RequestHandler) {
  const requestJSON = vi.fn((req: ApiRequest) => handler(normalise(req)));
  const request = vi.fn((req: ApiRequest) =>
    (requestHandler || (async () => ({ ok: true, status: 204 })))(normalise(req)) as Promise<Response>
  );
  const api = new GitLabNotesAPI({ repoURL: '/projects/owner%2Frepo', requestJSON, request });
  return { api, requestJSON, request };
}

function calls(mock: { mock: { calls: ApiRequest[][] } }) {
  return mock.mock.calls.map(([req]) => normalise(req));
}

const ISSUE = {
  iid: 12,
  title: 'Notes: My Post',
  description: noteIssueDescription('posts', 'my-post'),
  state: 'opened',
  updated_at: '2026-01-01T00:00:00Z',
  labels: ['decap-cms-notes', 'collection:posts'],
  web_url: 'https://gitlab.com/owner/repo/-/issues/12',
};

function comment(overrides: Record<string, unknown> = {}) {
  return {
    id: 99,
    body: 'a note',
    author: { username: 'ada', avatar_url: 'https://avatar' },
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('GitLab notes API', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findEntryIssue', () => {
    it('filters the project issue list rather than searching globally', async () => {
      const { api, requestJSON } = makeApi(async () => [ISSUE]);

      const issue = await api.findEntryIssue('posts', 'my-post');

      expect(issue?.iid).toBe(12);
      const [req] = calls(requestJSON);
      expect(req.url).toBe('/projects/owner%2Frepo/issues');
      expect(req.params).toMatchObject({
        labels: 'decap-cms-notes',
        search: 'posts/my-post',
        in: 'description',
      });
    });

    /**
     * `search` is a substring match, so asking for `posts/my-post` also returns
     * the thread for `posts/my-post-2`. Taking the first hit would attach notes
     * to the wrong entry, so the description is confirmed exactly.
     */
    it('does not match an entry whose slug merely contains this one', async () => {
      const longer = { ...ISSUE, iid: 13, description: noteIssueDescription('posts', 'my-post-2') };
      const { api } = makeApi(async () => [longer]);

      expect(await api.findEntryIssue('posts', 'my-post')).toBeNull();
    });

    it('picks the exact entry out of a mixed result', async () => {
      const longer = { ...ISSUE, iid: 13, description: noteIssueDescription('posts', 'my-post-2') };
      const { api } = makeApi(async () => [longer, ISSUE]);

      expect((await api.findEntryIssue('posts', 'my-post'))?.iid).toBe(12);
    });

    it("treats an issue with no description as not this entry's thread", async () => {
      const { api } = makeApi(async () => [{ ...ISSUE, description: null }]);

      expect(await api.findEntryIssue('posts', 'my-post')).toBeNull();
    });

    /**
     * `search` is a substring match, so enough longer slugs sharing this prefix
     * push the exact thread off page one. Stopping there returned null and
     * addNoteToEntry opened a second thread, splitting the entry's notes.
     */
    it('pages past a full page of substring matches to find the exact thread', async () => {
      const decoys = Array.from({ length: 100 }, (_, i) => ({
        ...ISSUE,
        iid: 200 + i,
        description: noteIssueDescription('posts', `my-post-${i}`),
      }));
      const { api, requestJSON } = makeApi(async req =>
        req.params?.['page'] === 1 ? decoys : req.params?.['page'] === 2 ? [ISSUE] : []
      );

      expect((await api.findEntryIssue('posts', 'my-post'))?.iid).toBe(12);
      expect(calls(requestJSON).map(req => req.params?.['page'])).toEqual([1, 2]);
    });

    it('stops paging as soon as the exact thread is found', async () => {
      const { api, requestJSON } = makeApi(async () => [ISSUE]);

      await api.findEntryIssue('posts', 'my-post');

      expect(requestJSON).toHaveBeenCalledTimes(1);
    });

    it('gives up after a bounded number of pages', async () => {
      const decoys = Array.from({ length: 100 }, (_, i) => ({
        ...ISSUE,
        iid: 200 + i,
        description: noteIssueDescription('posts', `my-post-${i}`),
      }));
      const { api, requestJSON } = makeApi(async () => decoys);

      expect(await api.findEntryIssue('posts', 'my-post')).toBeNull();
      expect(requestJSON).toHaveBeenCalledTimes(20);
    });

    it('fails rather than reporting no thread when the lookup errors', async () => {
      const { api } = makeApi(async () => {
        throw new Error('boom');
      });

      await expect(api.findEntryIssue('posts', 'my-post')).rejects.toThrow('boom');
    });
  });

  describe('getEntryNotes', () => {
    it('drops GitLab activity entries, which are not notes', async () => {
      // "changed the description", "closed" and friends arrive on the same
      // endpoint as real comments, flagged `system`.
      const { api } = makeApi(async req => {
        if (req.url.endsWith('/notes')) {
          return [
            comment({ id: 1, body: 'a real note' }),
            comment({ id: 2, body: 'changed the description', system: true }),
          ];
        }
        return [ISSUE];
      });

      const notes = await api.getEntryNotes('posts', 'my-post');

      expect(notes).toHaveLength(1);
      expect(notes[0].content).toBe('a real note');
    });

    it('reads the comments of the thread it found, oldest first', async () => {
      const { api, requestJSON } = makeApi(async req => (req.url.endsWith('/notes') ? [comment()] : [ISSUE]));

      await api.getEntryNotes('posts', 'my-post');

      const read = calls(requestJSON).find(req => req.url.endsWith('/notes'));
      expect(read?.url).toBe('/projects/owner%2Frepo/issues/12/notes');
      expect(read?.params).toMatchObject({ sort: 'asc', order_by: 'created_at', per_page: 100 });
    });

    it('skips a malformed comment instead of failing the whole thread', async () => {
      const { api } = makeApi(async req => {
        if (req.url.endsWith('/notes')) {
          return [
            comment({ id: 1, body: '<!-- DecapCMS Note {"resolved":false} -->\n   ' }),
            comment({ id: 2, body: 'a real note' }),
          ];
        }
        return [ISSUE];
      });

      const notes = await api.getEntryNotes('posts', 'my-post');

      expect(notes.map(note => note.content)).toEqual(['a real note']);
    });

    it('pages past the first page of comments', async () => {
      // A thread longer than one page silently lost its older notes.
      const page1 = Array.from({ length: 100 }, (_, i) => comment({ id: i + 1, body: `note ${i}` }));
      const { api } = makeApi(async req => {
        if (req.url.endsWith('/notes')) {
          return req.params?.['page'] === 1
            ? page1
            : req.params?.['page'] === 2
            ? [comment({ id: 999, body: 'last' })]
            : [];
        }
        return [ISSUE];
      });

      const notes = await api.getEntryNotes('posts', 'my-post');

      expect(notes).toHaveLength(101);
      expect(notes[notes.length - 1].content).toBe('last');
    });

    it('carries the thread url so the pane can link to it', async () => {
      const { api } = makeApi(async req => (req.url.endsWith('/notes') ? [comment()] : [ISSUE]));

      const [note] = await api.getEntryNotes('posts', 'my-post');

      expect(note.issueUrl).toBe(ISSUE.web_url);
    });

    it('reads the resolved flag from the note marker', async () => {
      const body = formatNoteBody({ content: 'done', resolved: true });
      const { api } = makeApi(async req => (req.url.endsWith('/notes') ? [comment({ body })] : [ISSUE]));

      const [note] = await api.getEntryNotes('posts', 'my-post');

      expect(note).toMatchObject({ id: '99', content: 'done', resolved: true });
    });

    it('reads a recorded author, and drops the poster avatar with it', async () => {
      const body = formatNoteBody({
        content: 'hello',
        resolved: false,
        author: 'Ada Lovelace',
        authorId: 'u-1',
      });
      const { api } = makeApi(async req => (req.url.endsWith('/notes') ? [comment({ body })] : [ISSUE]));

      const [note] = await api.getEntryNotes('posts', 'my-post');

      expect(note.author).toBe('Ada Lovelace');
      expect(note.authorId).toBe('u-1');
      expect(note.avatarUrl).toBeUndefined();
    });

    it('falls back to the posting account when the note records no author', async () => {
      const { api } = makeApi(async req => (req.url.endsWith('/notes') ? [comment()] : [ISSUE]));

      const [note] = await api.getEntryNotes('posts', 'my-post');

      expect(note.author).toBe('ada');
      expect(note.avatarUrl).toBe('https://avatar');
    });

    it('reads a comment whose author GitLab no longer reports', async () => {
      const { api } = makeApi(async req => (req.url.endsWith('/notes') ? [comment({ author: null })] : [ISSUE]));

      const [note] = await api.getEntryNotes('posts', 'my-post');

      expect(note.author).toBe('Unknown');
    });

    it('returns nothing when the entry has no thread yet', async () => {
      const { api, requestJSON } = makeApi(async () => []);

      expect(await api.getEntryNotes('posts', 'my-post')).toEqual([]);
      expect(calls(requestJSON).some(req => req.url.endsWith('/notes'))).toBe(false);
    });

    it('fails rather than reporting no notes when the thread cannot be read', async () => {
      const { api } = makeApi(async req => {
        if (req.url.endsWith('/notes')) {
          throw new Error('boom');
        }
        return [ISSUE];
      });

      await expect(api.getEntryNotes('posts', 'my-post')).rejects.toThrow('boom');
    });
  });

  describe('writes', () => {
    it('opens a thread on the first note and comments on it', async () => {
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'POST' && req.url.endsWith('/issues')) return ISSUE;
        if (req.method === 'POST') return { id: 77 };
        return [];
      });

      const result = await api.addNoteToEntry('posts', 'my-post', { content: 'hello', resolved: false }, 'My Post');

      expect(result).toEqual({ commentId: '77', issueUrl: ISSUE.web_url });
      const created = calls(requestJSON).find(req => req.method === 'POST' && req.url.endsWith('/issues'))!;
      const body = JSON.parse(created.body as string);
      expect(body.title).toBe('Notes: My Post');
      expect(body.description).toBe(noteIssueDescription('posts', 'my-post'));
      expect(body.labels).toBe('decap-cms-notes,collection:posts');
      const commented = calls(requestJSON).find(req => req.method === 'POST' && req.url.endsWith('/notes'))!;
      expect(commented.url).toBe('/projects/owner%2Frepo/issues/12/notes');
    });

    it('names a new thread after the entry path when no title is given', async () => {
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'POST' && req.url.endsWith('/issues')) return ISSUE;
        if (req.method === 'POST') return { id: 77 };
        return [];
      });

      await api.addNoteToEntry('posts', 'my-post', { content: 'hello', resolved: false });

      const created = calls(requestJSON).find(req => req.method === 'POST' && req.url.endsWith('/issues'))!;
      expect(JSON.parse(created.body as string).title).toBe('Notes: posts/my-post');
    });

    it('does not open a second thread when the search for the first fails', async () => {
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'POST') {
          return { ...ISSUE, id: 501 };
        }
        throw Object.assign(new Error('Bad gateway'), { status: 502 });
      });

      const added = api.addNoteToEntry('posts', 'my-post', { content: 'hello', resolved: false });

      await expect(added).rejects.toThrow('Failed to create note');
      await expect(added).rejects.toMatchObject({ status: 502, api: 'GitLab' });
      expect(calls(requestJSON).filter(req => req.method === 'POST')).toHaveLength(0);
    });

    it('reuses the existing thread rather than opening a second', async () => {
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'POST') return { id: 78 };
        return [ISSUE];
      });

      await api.addNoteToEntry('posts', 'my-post', { content: 'hello', resolved: false });

      const created = calls(requestJSON).filter(req => req.method === 'POST' && req.url.endsWith('/issues'));
      expect(created).toHaveLength(0);
    });

    it('sends the note body as JSON, not in the query string', async () => {
      // A note is arbitrary markdown and a long one does not belong in a URL.
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'POST') return { id: 79 };
        return [ISSUE];
      });

      await api.addNoteToEntry('posts', 'my-post', { content: 'multi\nline', resolved: false });

      const posted = calls(requestJSON).find(req => req.method === 'POST')!;
      expect(posted.params).toBeUndefined();
      expect(posted.headers).toEqual({ 'Content-Type': 'application/json; charset=utf-8' });
      expect(JSON.parse(posted.body as string).body).toBe(
        formatNoteBody({ content: 'multi\nline', resolved: false }),
      );
    });

    it('addresses a comment by its thread, since ids are scoped to it', async () => {
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'PUT') return {};
        return [ISSUE];
      });

      await api.updateEntryNote('posts', 'my-post', '99', { content: 'edited', resolved: true });

      const put = calls(requestJSON).find(req => req.method === 'PUT')!;
      expect(put.url).toBe('/projects/owner%2Frepo/issues/12/notes/99');
      expect(JSON.parse(put.body as string).body).toBe(formatNoteBody({ content: 'edited', resolved: true }));
    });

    it('deletes through the thread, and treats 204 as success', async () => {
      const { api, request } = makeApi(async () => [ISSUE]);

      await expect(api.deleteEntryNote('posts', 'my-post', '99')).resolves.toBeUndefined();

      const [del] = calls(request);
      expect(del.url).toBe('/projects/owner%2Frepo/issues/12/notes/99');
      expect(del.method).toBe('DELETE');
    });

    it('still reports a delete the host refused', async () => {
      const { api } = makeApi(
        async () => [ISSUE],
        async () => ({ ok: false, status: 403 }),
      );

      await expect(api.deleteEntryNote('posts', 'my-post', '99')).rejects.toMatchObject({
        message: 'Failed to delete note',
        status: 403,
      });
    });

    it('does not search for the thread again once it is known', async () => {
      const { api, requestJSON } = makeApi(async req => (req.method ? {} : [ISSUE]));
      function searches() {
        return calls(requestJSON).filter(req => req.params?.['search']).length;
      }

      await api.findEntryIssue('posts', 'my-post');
      expect(searches()).toBe(1);

      await api.updateEntryNote('posts', 'my-post', '99', { content: 'x', resolved: true });
      await api.deleteEntryNote('posts', 'my-post', '99');

      expect(searches()).toBe(1);
    });

    it('remembers the thread it created for the next write', async () => {
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'POST' && req.url.endsWith('/issues')) return ISSUE;
        if (req.method) return { id: 77 };
        return [];
      });
      function searches() {
        return calls(requestJSON).filter(req => req.params?.['search']).length;
      }

      await api.addNoteToEntry('posts', 'my-post', { content: 'hello', resolved: false });
      await api.updateEntryNote('posts', 'my-post', '77', { content: 'x', resolved: true });

      expect(searches()).toBe(1);
      expect(calls(requestJSON).find(req => req.method === 'PUT')?.url).toBe(
        '/projects/owner%2Frepo/issues/12/notes/77',
      );
    });

    it('looks the thread up afresh after the remembered one turns out to be gone', async () => {
      const { api, requestJSON } = makeApi(async req => {
        if (req.method === 'PUT') {
          throw Object.assign(new Error('Not found'), { status: 404 });
        }
        return [ISSUE];
      });
      function searches() {
        return calls(requestJSON).filter(req => req.params?.['search']).length;
      }
      const note = { content: 'x', resolved: true };

      await expect(api.updateEntryNote('posts', 'my-post', '99', note)).rejects.toMatchObject({ status: 404 });
      await expect(api.updateEntryNote('posts', 'my-post', '99', note)).rejects.toThrow();

      expect(searches()).toBe(2);
    });

    it('forgets the remembered thread when a delete finds it gone', async () => {
      const { api, requestJSON } = makeApi(
        async () => [ISSUE],
        async () => ({ ok: false, status: 404 }),
      );
      function searches() {
        return calls(requestJSON).filter(req => req.params?.['search']).length;
      }

      await expect(api.deleteEntryNote('posts', 'my-post', '99')).rejects.toThrow();
      await expect(api.deleteEntryNote('posts', 'my-post', '99')).rejects.toThrow();

      expect(searches()).toBe(2);
    });

    it('refuses to mutate a note whose thread is gone', async () => {
      const { api, request } = makeApi(async () => []);

      await expect(api.updateEntryNote('posts', 'my-post', '99', { content: 'x', resolved: false })).rejects
        .toMatchObject({ status: 404 });
      await expect(api.deleteEntryNote('posts', 'my-post', '99')).rejects.toMatchObject({ status: 404 });
      expect(request).not.toHaveBeenCalled();
    });
  });

  describe('thread lifecycle', () => {
    it('closes and labels the thread when the entry is published', async () => {
      const { api, requestJSON } = makeApi(async req => (req.method === 'PUT' ? {} : [ISSUE]));

      await api.closeIssueOnPublish('posts', 'my-post');

      const put = calls(requestJSON).find(req => req.method === 'PUT')!;
      expect(put.url).toBe('/projects/owner%2Frepo/issues/12');
      const body = JSON.parse(put.body as string);
      expect(body.state_event).toBe('close');
      // GitLab replaces labels wholesale, so the existing ones must come along.
      expect(body.labels.split(',')).toEqual(
        expect.arrayContaining(['decap-cms-notes', 'collection:posts', 'entry-published']),
      );
    });

    it('does not close a thread that is already closed', async () => {
      const { api, requestJSON } = makeApi(async () => [{ ...ISSUE, state: 'closed' }]);

      await api.closeIssueOnPublish('posts', 'my-post');

      expect(calls(requestJSON).filter(req => req.method === 'PUT')).toHaveLength(0);
    });

    it('does nothing on publish when the entry has no thread', async () => {
      const { api, requestJSON } = makeApi(async () => []);

      await api.closeIssueOnPublish('posts', 'my-post');

      expect(calls(requestJSON).filter(req => req.method === 'PUT')).toHaveLength(0);
    });

    it('does not fail the publish when the thread cannot be closed', async () => {
      const { api } = makeApi(async req => {
        if (req.method === 'PUT') throw new Error('boom');
        return [ISSUE];
      });

      await expect(api.closeIssueOnPublish('posts', 'my-post')).resolves.toBeUndefined();
    });

    it('closes and labels the thread when the unpublished entry is deleted', async () => {
      const { api, requestJSON } = makeApi(async req => (req.method === 'PUT' ? {} : [ISSUE]));

      await api.closeEntryNotesIssue('posts', 'my-post');

      const body = JSON.parse(calls(requestJSON).find(req => req.method === 'PUT')!.body as string);
      expect(body.state_event).toBe('close');
      expect(body.labels.split(',')).toEqual(
        expect.arrayContaining(['decap-cms-notes', 'collection:posts', 'entry-deleted']),
      );
    });

    it('does not fail the delete when the thread cannot be closed', async () => {
      const { api } = makeApi(async () => {
        throw new Error('boom');
      });

      await expect(api.closeEntryNotesIssue('posts', 'my-post')).resolves.toBeUndefined();
    });

    it('reopens on unpublish and clears the lifecycle labels', async () => {
      const closed = { ...ISSUE, state: 'closed', labels: [...ISSUE.labels, 'entry-published', 'entry-deleted'] };
      const { api, requestJSON } = makeApi(async req => (req.method === 'PUT' ? {} : [closed]));

      await api.reopenIssueOnUnpublish('posts', 'my-post');

      const body = JSON.parse(calls(requestJSON).find(req => req.method === 'PUT')!.body as string);
      expect(body.state_event).toBe('reopen');
      expect(body.labels).toBe('decap-cms-notes,collection:posts');
    });
  });

  describe('polling adapter', () => {
    /**
     * Swallowing the error and answering 200 with no comments is
     * indistinguishable from a thread whose notes were all deleted: the
     * polling manager diffs against it, emits comment_deleted for every note
     * and blanks the pane. Throwing leaves its last state alone.
     */
    it('propagates a failed comment fetch instead of reporting an empty thread', async () => {
      const { api } = makeApi(async req => {
        if (req.url.endsWith('/notes')) throw new Error('503');
        return req.url.endsWith('/12') ? ISSUE : [ISSUE];
      });

      await expect(api.asPollingAPI().getIssueWithETag(12, null)).rejects.toThrow();
    });

    it('always reads in full, since GitLab offers no ETag on issues', async () => {
      const { api } = makeApi(async req =>
        req.url.endsWith('/notes') ? [comment()] : req.url.endsWith('/12') ? ISSUE : [ISSUE]
      );

      const response = await api.asPollingAPI().getIssueWithETag(12, 'W/"previous"');

      expect(response.status).toBe(200);
      expect(response.etag).toBeNull();
    });

    it('translates GitLab iid to the number the shared interface expects', async () => {
      const { api } = makeApi(async () => [ISSUE]);

      expect(await api.asPollingAPI().findEntryIssue('posts', 'my-post')).toEqual({ number: 12 });
    });

    it('reports no thread as null', async () => {
      const { api } = makeApi(async () => []);

      expect(await api.asPollingAPI().findEntryIssue('posts', 'my-post')).toBeNull();
    });

    it('maps the issue and its comments onto the shared state', async () => {
      const { api, requestJSON } = makeApi(async req =>
        req.url.endsWith('/notes')
          ? [comment(), comment({ id: 100, body: 'closed', system: true })]
          : req.url.endsWith('/12')
          ? ISSUE
          : [ISSUE]
      );

      const state = await api.asPollingAPI().getIssueState(12);

      expect(calls(requestJSON).map(req => req.url)).toContain('/projects/owner%2Frepo/issues/12');
      expect(state).toEqual({
        number: 12,
        title: 'Notes: My Post',
        body: ISSUE.description,
        state: 'open',
        updated_at: ISSUE.updated_at,
        comments: [
          {
            id: 99,
            body: 'a note',
            user: { login: 'ada', avatar_url: 'https://avatar' },
            created_at: '2026-01-02T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
          },
        ],
        labels: [
          { name: 'decap-cms-notes', color: '' },
          { name: 'collection:posts', color: '' },
        ],
        html_url: ISSUE.web_url,
      });
    });

    it('maps closed to closed', async () => {
      const { api } = makeApi(async req => (req.url.endsWith('/notes') ? [] : { ...ISSUE, state: 'closed' }));

      expect((await api.asPollingAPI().getIssueState(12)).state).toBe('closed');
    });
  });
});
