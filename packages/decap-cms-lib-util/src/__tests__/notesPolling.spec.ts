import { NotesPollingManager } from '../notesPolling';

import type { NotesPollingAPI } from '../notesPolling';
import type { CommentData, IssueState } from '../implementation';

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
    getIssueState: jest.fn(),
    getIssueWithETag: jest.fn(),
    findEntryIssue: jest.fn(),
    parseCommentToNote: jest.fn((c: CommentData) => ({
      id: String(c.id),
      author: c.user?.login ?? 'Unknown',
      content: c.body,
      timestamp: c.created_at,
      resolved: false,
      entrySlug: '',
    })),
    ...overrides,
  } as jest.Mocked<NotesPollingAPI>;
}

async function flush() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

describe('NotesPollingManager', () => {
  let manager: NotesPollingManager;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    manager?.destroy();
    jest.restoreAllMocks();
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

      const onUpdate = jest.fn();
      const prepareNotes = jest.fn(async notes =>
        notes.map((note: object) => ({ ...note, isOwn: true })),
      );

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

      const onUpdate = jest.fn();
      const prepareNotes = jest
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

    it('drops an update whose watch was replaced while prepareNotes was in flight', async () => {
      const api = createApi();
      api.getIssueWithETag.mockImplementation(async issueNumber =>
        issueNumber === 12
          ? { status: 200, data: issueState([comment(1), comment(2)]), etag: null }
          : { status: 304 },
      );
      manager = new NotesPollingManager(api);

      const pending: Array<() => void> = [];
      const onUpdateA = jest.fn();
      const prepareNotes = jest.fn(
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
