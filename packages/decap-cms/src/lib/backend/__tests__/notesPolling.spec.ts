import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotesPollingManager } from '@/lib/backend/notesPolling';

import type { CommentData, IssueState } from '@/lib/backend/notes';
import type { NotesPollingAPI } from '@/lib/backend/notesPolling';
import type { MockedObject } from 'vitest';

function comment(id: number, body = `note ${id}`): CommentData {
  return {
    id,
    body,
    user: { login: 'alice', avatar_url: '' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function issueState(comments: CommentData[]): IssueState {
  return {
    number: 12,
    title: 'Notes: posts/my-post',
    body: '',
    state: 'open',
    updated_at: '2026-01-01T00:00:00Z',
    comments,
    labels: [],
    html_url: 'https://example.com/issues/12',
  };
}

function createApi(overrides: Partial<NotesPollingAPI> = {}) {
  return {
    getIssueState: vi.fn(),
    getIssueWithETag: vi.fn(),
    findEntryIssue: vi.fn(),
    parseCommentToNote: vi.fn((c: CommentData) => ({
      id: String(c.id),
      author: c.user?.login ?? 'Unknown',
      content: c.body,
      timestamp: c.created_at,
      resolved: false,
      entrySlug: '',
    })),
    ...overrides,
  } as MockedObject<NotesPollingAPI>;
}

async function flush() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

describe('NotesPollingManager', () => {
  let manager: NotesPollingManager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    manager?.destroy();
    vi.restoreAllMocks();
  });

  it('stops listening for tab visibility once destroyed', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');

    manager = new NotesPollingManager(createApi());
    const [, listener] = add.mock.calls.find(([type]) => type === 'visibilitychange')!;

    manager.destroy();

    expect(remove).toHaveBeenCalledWith('visibilitychange', listener);
  });

  describe('looking for an issue that does not exist yet', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('abandons the search for entry A once entry B is watched', async () => {
      const api = createApi();
      api.findEntryIssue.mockImplementation(async (_collection, slug) => slug === 'entry-b' ? { number: 13 } : null);
      api.getIssueWithETag.mockResolvedValue({ status: 304 });
      manager = new NotesPollingManager(api);

      const chainA = manager.watchIssueWithRetry('posts', 'entry-a', {}, 5, 2000);
      await flush();
      expect(manager.getStatus().hasPendingRetry).toBe(true);

      await manager.watchIssueWithRetry('posts', 'entry-b', {}, 5, 2000);
      expect(manager.getStatus().currentWatch).toBe('posts/entry-b');

      api.findEntryIssue.mockResolvedValue({ number: 12 });
      vi.advanceTimersByTime(10000);
      await flush();

      const unwatchA = await chainA;
      unwatchA();

      expect(manager.getStatus().currentWatch).toBe('posts/entry-b');
      expect(api.findEntryIssue).toHaveBeenCalledTimes(2);
    });

    it('abandons a lookup that was in flight when the entry changed', async () => {
      const api = createApi();
      const lookups: Array<(issue: { number: number } | null) => void> = [];
      api.findEntryIssue.mockImplementation(
        (_collection, slug) =>
          new Promise(resolve => {
            if (slug === 'entry-a') {
              lookups.push(resolve);
            } else {
              resolve({ number: 13 });
            }
          }),
      );
      api.getIssueWithETag.mockResolvedValue({ status: 304 });
      manager = new NotesPollingManager(api);

      const chainA = manager.watchIssueWithRetry('posts', 'entry-a', {});
      await manager.watchIssueWithRetry('posts', 'entry-b', {});

      lookups.forEach(resolve => resolve({ number: 12 }));
      await chainA;

      expect(manager.getStatus().currentWatch).toBe('posts/entry-b');
    });

    it('can be stopped by entry while still searching', async () => {
      const api = createApi();
      api.findEntryIssue.mockResolvedValue(null);
      manager = new NotesPollingManager(api);

      const chain = manager.watchIssueWithRetry('posts', 'entry-a', {}, 5, 2000);
      await flush();

      manager.stopWatching('posts', 'entry-b');
      expect(manager.getStatus().hasPendingRetry).toBe(true);

      manager.stopWatching('posts', 'entry-a');
      expect(manager.getStatus().hasPendingRetry).toBe(false);

      await chain;
      vi.advanceTimersByTime(10000);
      await flush();
      expect(api.findEntryIssue).toHaveBeenCalledTimes(1);
    });

    it('starts watching once the issue appears', async () => {
      const api = createApi();
      api.findEntryIssue.mockResolvedValueOnce(null).mockResolvedValue({ number: 12 });
      api.getIssueWithETag.mockResolvedValue({ status: 304 });
      manager = new NotesPollingManager(api);

      const chain = manager.watchIssueWithRetry('posts', 'entry-a', {}, 5, 2000);
      await flush();
      vi.advanceTimersByTime(2000);
      await chain;

      expect(manager.getStatus().currentWatch).toBe('posts/entry-a');
    });
  });

  describe('delivering changes', () => {
    it('reports notes once prepareNotes has resolved', async () => {
      const api = createApi();
      api.getIssueWithETag.mockResolvedValue({
        status: 200,
        data: issueState([comment(1), comment(2)]),
        etag: 'b',
      });
      manager = new NotesPollingManager(api);

      const onUpdate = vi.fn();
      const prepareNotes = vi.fn(async notes => notes.map((note: object) => ({ ...note, isOwn: true })));

      await manager.watchIssue(
        12,
        'posts',
        'my-post',
        { onUpdate, prepareNotes },
        issueState([comment(1)]),
      );
      await flush();

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toEqual([
        expect.objectContaining({ id: '1', isOwn: true }),
        expect.objectContaining({ id: '2', isOwn: true }),
      ]);
    });

    it('retries a change on the next poll when prepareNotes fails', async () => {
      const api = createApi();
      api.getIssueWithETag.mockResolvedValue({
        status: 200,
        data: issueState([comment(1), comment(2)]),
        etag: 'b',
      });
      manager = new NotesPollingManager(api);

      const onUpdate = vi.fn();
      const prepareNotes = vi
        .fn()
        .mockRejectedValueOnce(new Error('identity lookup failed'))
        .mockImplementation(async notes => notes);

      await manager.watchIssue(
        12,
        'posts',
        'my-post',
        { onUpdate, prepareNotes },
        issueState([comment(1)]),
      );
      await flush();

      expect(onUpdate).not.toHaveBeenCalled();

      await manager.checkIssueNow('posts', 'my-post');

      expect(api.getIssueWithETag).toHaveBeenLastCalledWith(12, null);
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][1]).toEqual([
        expect.objectContaining({ type: 'comment_added' }),
      ]);
    });

    it('skips a comment that is not a note and keeps polling', async () => {
      const api = createApi();
      api.parseCommentToNote.mockImplementation(c => {
        if (!c.body) {
          throw new Error('Empty note content');
        }
        return {
          id: String(c.id),
          author: 'alice',
          content: c.body,
          timestamp: c.created_at,
          resolved: false,
          entrySlug: '',
        };
      });
      api.getIssueWithETag.mockResolvedValue({
        status: 200,
        data: issueState([comment(1), comment(2, ''), comment(3)]),
        etag: 'b',
      });
      manager = new NotesPollingManager(api);

      const onUpdate = vi.fn();
      await manager.watchIssue(12, 'posts', 'my-post', { onUpdate }, issueState([comment(1)]));
      await flush();

      expect(onUpdate.mock.calls[0][0].map((note: { id: string }) => note.id)).toEqual(['1', '3']);

      await manager.checkIssueNow('posts', 'my-post');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('drops an update whose watch was replaced while prepareNotes was in flight', async () => {
      const api = createApi();
      api.getIssueWithETag.mockImplementation(async issueNumber =>
        issueNumber === 12
          ? { status: 200, data: issueState([comment(1), comment(2)]), etag: null }
          : { status: 304 }
      );
      manager = new NotesPollingManager(api);

      const pending: Array<() => void> = [];
      const onUpdateA = vi.fn();
      const prepareNotes = vi.fn(
        notes => new Promise(resolve => pending.push(() => resolve(notes))),
      );

      await manager.watchIssue(
        12,
        'posts',
        'entry-a',
        { onUpdate: onUpdateA, prepareNotes },
        issueState([comment(1)]),
      );
      await flush();
      expect(prepareNotes).toHaveBeenCalled();

      await manager.watchIssue(13, 'posts', 'entry-b', {}, issueState([]));
      pending.forEach(release => release());
      await flush();

      expect(onUpdateA).not.toHaveBeenCalled();
    });
  });
});
