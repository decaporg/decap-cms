import { beforeEach, describe, expect, it, vi } from 'vitest';

import GitHubImplementation from '@/backends/github/implementation';
import { Cursor, CURSOR_COMPATIBILITY_SYMBOL } from '@/lib/util/index';

vi.spyOn(console, 'error').mockImplementation(() => {});

describe('github backend implementation', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      open_authoring: false,
      api_root: 'https://api.github.com',
    },
  };

  const createObjectURL = vi.fn();
  global.URL = {
    createObjectURL,
  };

  createObjectURL.mockReturnValue('displayURL');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authComponent', () => {
    it('should return the same component reference across calls', () => {
      const gitHubImplementation = new GitHubImplementation(config);

      expect(gitHubImplementation.authComponent()).toBe(gitHubImplementation.authComponent());
    });
  });

  describe('forkExists', () => {
    it('should return true when repo is fork and parent matches originRepo', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = vi.fn().mockResolvedValue({ login: 'login' });

      global.fetch = vi.fn().mockResolvedValue({
        // matching should be case-insensitive
        json: () => ({ fork: true, parent: { full_name: 'OWNER/REPO' } }),
      });

      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(true);

      expect(gitHubImplementation.currentUser).toHaveBeenCalledTimes(1);
      expect(gitHubImplementation.currentUser).toHaveBeenCalledWith({ token: 'token' });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/repos/login/repo', {
        method: 'GET',
        headers: {
          Authorization: 'token token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should return false when repo is not a fork', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = vi.fn().mockResolvedValue({ login: 'login' });

      global.fetch = vi.fn().mockResolvedValue({
        // matching should be case-insensitive
        json: () => ({ fork: false }),
      });

      expect.assertions(1);
      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(false);
    });

    it("should return false when parent doesn't match originRepo", async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = vi.fn().mockResolvedValue({ login: 'login' });

      global.fetch = vi.fn().mockResolvedValue({
        json: () => ({ fork: true, parent: { full_name: 'owner/other_repo' } }),
      });

      expect.assertions(1);
      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(false);
    });
  });

  describe('persistMedia', () => {
    const persistFiles = vi.fn();
    const mockAPI = {
      persistFiles,
      // `persistMedia` resolves the Git LFS client first, which reads
      // `.gitattributes`. These cases cover the non-LFS path, so report the
      // repo as having no `.gitattributes` at all (see git-lfs.spec.ts for
      // the LFS paths).
      readFile: vi.fn(() => Promise.reject(Object.assign(new Error('Not Found'), { status: 404 }))),
    };

    persistFiles.mockImplementation((_, files) => {
      files.forEach((file, index) => {
        file.sha = index;
      });
    });

    it('should persist media file', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const mediaFile = {
        fileObj: { size: 100, name: 'image.png' },
        path: '/media/image.png',
      };

      expect.assertions(5);
      await expect(gitHubImplementation.persistMedia(mediaFile, {})).resolves.toEqual({
        id: 0,
        name: 'image.png',
        size: 100,
        displayURL: 'displayURL',
        path: 'media/image.png',
      });

      expect(persistFiles).toHaveBeenCalledTimes(1);
      expect(persistFiles).toHaveBeenCalledWith([], [mediaFile], {});
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledWith(mediaFile.fileObj);
    });

    it('should log and throw error on "persistFiles" error', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const error = new Error('failed to persist files');
      persistFiles.mockRejectedValue(error);

      const mediaFile = {
        value: 'image.png',
        fileObj: { size: 100 },
        path: '/media/image.png',
      };

      expect.assertions(5);
      await expect(gitHubImplementation.persistMedia(mediaFile)).rejects.toThrowError(error);

      expect(persistFiles).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledTimes(0);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(error);
    });
  });

  describe('unpublishedEntry', () => {
    const generateContentKey = vi.fn();
    const retrieveUnpublishedEntryData = vi.fn();

    const mockAPI = {
      generateContentKey,
      retrieveUnpublishedEntryData,
    };

    it('should return unpublished entry data', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;
      gitHubImplementation.loadEntryMediaFiles = vi
        .fn()
        .mockResolvedValue([{ path: 'image.png', id: 'sha' }]);

      generateContentKey.mockReturnValue('contentKey');

      const data = {
        collection: 'collection',
        slug: 'slug',
        status: 'draft',
        diffs: [],
        updatedAt: 'updatedAt',
      };
      retrieveUnpublishedEntryData.mockResolvedValue(data);

      const collection = 'posts';
      const slug = 'slug';
      await expect(gitHubImplementation.unpublishedEntry({ collection, slug })).resolves.toEqual(
        data,
      );

      expect(generateContentKey).toHaveBeenCalledTimes(1);
      expect(generateContentKey).toHaveBeenCalledWith('posts', 'slug');

      expect(retrieveUnpublishedEntryData).toHaveBeenCalledTimes(1);
      expect(retrieveUnpublishedEntryData).toHaveBeenCalledWith('contentKey');
    });
  });

  describe('entriesByFolder', () => {
    const listFiles = vi.fn();
    const readFile = vi.fn();
    const readFileMetadata = vi.fn(() => Promise.resolve({ author: '', updatedOn: '' }));

    const mockAPI = {
      listFiles,
      readFile,
      readFileMetadata,
      originRepoURL: 'originRepoURL',
    };

    it('should return entries and cursor', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const files = [];
      const count = 1501;
      for (let i = 0; i < count; i++) {
        const id = `${i}`.padStart(`${count}`.length, '0');
        files.push({
          id,
          path: `posts/post-${id}.md`,
        });
      }

      listFiles.mockResolvedValue(files);
      readFile.mockImplementation((path, id) => Promise.resolve(`${id}`));

      const expectedEntries = files
        .slice(0, 20)
        .map(({ id, path }) => ({ content: { kind: 'raw', raw: id }, file: { path, id, updatedOn: '' } }));

      const expectedCursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      expectedEntries[CURSOR_COMPATIBILITY_SYMBOL] = expectedCursor;

      const result = await gitHubImplementation.entriesByFolder('posts', 'md', 1);

      expect(result).toEqual(expectedEntries);
      expect(listFiles).toHaveBeenCalledTimes(1);
      expect(listFiles).toHaveBeenCalledWith('posts', { depth: 1, repoURL: 'originRepoURL' });
      expect(readFile).toHaveBeenCalledTimes(20);
    });
  });

  describe('traverseCursor', () => {
    const listFiles = vi.fn();
    const readFile = vi.fn((path, id) => Promise.resolve(`${id}`));
    const readFileMetadata = vi.fn(() => Promise.resolve({}));

    const mockAPI = {
      listFiles,
      readFile,
      originRepoURL: 'originRepoURL',
      readFileMetadata,
    };

    const files = [];
    const count = 1501;
    for (let i = 0; i < count; i++) {
      const id = `${i}`.padStart(`${count}`.length, '0');
      files.push({
        id,
        path: `posts/post-${id}.md`,
      });
    }

    it('should handle next action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(20, 40)
        .map(({ id, path }) => ({ content: { kind: 'raw', raw: id }, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['prev', 'first', 'next', 'last'],
        meta: { page: 2, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'next');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle prev action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['prev', 'first', 'next', 'last'],
        meta: { page: 2, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(0, 20)
        .map(({ id, path }) => ({ content: { kind: 'raw', raw: id }, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'prev');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle last action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(1500)
        .map(({ id, path }) => ({ content: { kind: 'raw', raw: id }, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['prev', 'first'],
        meta: { page: 76, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'last');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle first action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['prev', 'first'],
        meta: { page: 76, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(0, 20)
        .map(({ id, path }) => ({ content: { kind: 'raw', raw: id }, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'first');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });
  });

  describe('notes implementation', () => {
    const configWithNotes = {
      ...config,
      editor: { notes: true },
    };

    const mockAPI = {
      getEntryNotes: vi.fn(),
      addNoteToEntry: vi.fn(),
      updateEntryNote: vi.fn(),
      deleteEntryNote: vi.fn(),
      closeEntryNotesIssue: vi.fn(),
      closeIssueOnPublish: vi.fn(),
      reopenIssueOnUnpublish: vi.fn(),
      readFile: vi.fn(),
      deleteUnpublishedEntry: vi.fn(),
      publishUnpublishedEntry: vi.fn(),
    };

    function backend(cfg: object = config, user: object = { login: 'user1', avatar_url: 'https://avatar.url' }) {
      const gitHubImplementation = new GitHubImplementation(cfg);
      gitHubImplementation.api = mockAPI;
      gitHubImplementation.token = 'test-token';
      gitHubImplementation.currentUser = vi.fn().mockResolvedValue(user);
      return gitHubImplementation;
    }

    beforeEach(() => {
      Object.values(mockAPI).forEach(fn => fn.mockReset());
      mockAPI.deleteUnpublishedEntry.mockResolvedValue(undefined);
      mockAPI.publishUnpublishedEntry.mockResolvedValue(undefined);
    });

    describe('noteAuthorIdentity', () => {
      // GitHub reports the author's current login on every read, so ownership
      // follows a rename; an id recorded in the note would freeze it.
      it('is the login, with no recorded id', async () => {
        await expect(backend().noteAuthorIdentity()).resolves.toEqual({ author: 'user1' });
      });
    });

    describe('getNotes', () => {
      it('should retrieve notes for an entry', async () => {
        const gitHubImplementation = backend(configWithNotes);

        const mockNotes = [
          {
            id: '1',
            author: 'user1',
            avatarUrl: 'https://avatar.url',
            content: 'Test note',
            timestamp: '2025-01-01T00:00:00Z',
            resolved: false,
          },
          { id: '2', author: 'user2', content: 'Theirs', timestamp: '2025-01-01T00:00:00Z', resolved: false },
        ];

        mockAPI.getEntryNotes.mockResolvedValue(mockNotes);

        const result = await gitHubImplementation.getNotes('posts', 'my-post');

        expect(result).toEqual([
          { ...mockNotes[0], entrySlug: 'my-post', isOwn: true },
          { ...mockNotes[1], entrySlug: 'my-post', isOwn: false },
        ]);
        expect(mockAPI.getEntryNotes).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('should return empty array on error', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockRejectedValue(new Error('API Error'));

        const result = await gitHubImplementation.getNotes('posts', 'my-post');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Failed to get notes:', expect.any(Error));
      });
    });

    describe('addNote', () => {
      it('should add a note to an entry', async () => {
        const gitHubImplementation = backend(config, {
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://avatar.url',
        });

        const noteData = {
          content: 'New note',
          timestamp: '2025-01-01T00:00:00Z',
          resolved: false,
          author: 'whatever the pane said',
        };

        mockAPI.addNoteToEntry.mockResolvedValue({
          commentId: 'comment-123',
          issueUrl: 'https://github.com/owner/repo/issues/1',
        });

        const result = await gitHubImplementation.addNote('posts', 'my-post', noteData, 'My Post Title');

        expect(result).toEqual({
          content: 'New note',
          author: 'testuser',
          authorId: undefined,
          isOwn: true,
          avatarUrl: 'https://avatar.url',
          entrySlug: 'my-post',
          timestamp: '2025-01-01T00:00:00Z',
          resolved: false,
          id: 'comment-123',
          issueUrl: 'https://github.com/owner/repo/issues/1',
        });
        expect(mockAPI.addNoteToEntry).toHaveBeenCalledWith(
          'posts',
          'my-post',
          expect.objectContaining({ content: 'New note', author: 'testuser' }),
          'My Post Title',
        );
        // The title arrives from the caller; nothing is read back from the repo.
        expect(mockAPI.readFile).not.toHaveBeenCalled();
      });

      // The caller cannot always name the entry, so the thread falls back to
      // `collection/slug`.
      it('passes no title through when the caller has none', async () => {
        const gitHubImplementation = backend();

        mockAPI.addNoteToEntry.mockResolvedValue({
          commentId: 'comment-123',
          issueUrl: 'https://github.com/owner/repo/issues/1',
        });

        const result = await gitHubImplementation.addNote('posts', 'my-post', {
          content: 'New note',
          timestamp: '2025-01-01T00:00:00Z',
        });

        expect(mockAPI.addNoteToEntry).toHaveBeenCalledWith('posts', 'my-post', expect.any(Object), undefined);
        expect(result.id).toBe('comment-123');
        expect(result.resolved).toBe(false);
      });

      // A subclass that posts through an App records the editor in the note;
      // the App account's avatar would then mislabel it.
      it('records an identity the account does not carry, without its avatar', async () => {
        const gitHubImplementation = backend();
        gitHubImplementation.noteAuthorIdentity = vi.fn().mockResolvedValue({ author: 'Ada', authorId: 'u-1' });

        mockAPI.addNoteToEntry.mockResolvedValue({ commentId: '9', issueUrl: 'https://issue' });

        const result = await gitHubImplementation.addNote('posts', 'my-post', {
          content: 'New note',
          timestamp: '2025-01-01T00:00:00Z',
          resolved: false,
        });

        expect(mockAPI.addNoteToEntry).toHaveBeenCalledWith(
          'posts',
          'my-post',
          expect.objectContaining({ author: 'Ada', authorId: 'u-1', avatarUrl: undefined }),
          undefined,
        );
        expect(result).toMatchObject({ author: 'Ada', authorId: 'u-1', isOwn: true, avatarUrl: undefined });
      });
    });

    describe('updateNote', () => {
      it('should update an existing note', async () => {
        const gitHubImplementation = backend();

        const existingNotes = [
          {
            id: 'note-1',
            author: 'user1',
            avatarUrl: 'https://avatar.url',
            content: 'Original text',
            timestamp: '2025-01-01T00:00:00Z',
            resolved: false,
            entrySlug: 'my-post',
          },
        ];

        mockAPI.getEntryNotes.mockResolvedValue(existingNotes);
        mockAPI.updateEntryNote.mockResolvedValue(undefined);

        const updates = { content: 'Updated text', resolved: true };
        const result = await gitHubImplementation.updateNote('posts', 'my-post', 'note-1', updates);

        expect(result).toEqual({
          ...existingNotes[0],
          content: 'Updated text',
          resolved: true,
          isOwn: true,
        });
        expect(mockAPI.updateEntryNote).toHaveBeenCalledWith('note-1', result);
      });

      // The whole comment is rewritten, so a partial update keeps the rest.
      it('keeps the content when only the resolution changes', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockResolvedValue([
          { id: 'note-1', author: 'user1', content: 'Keep me', resolved: false, timestamp: '' },
        ]);

        await gitHubImplementation.updateNote('posts', 'my-post', 'note-1', { resolved: true });

        expect(mockAPI.updateEntryNote).toHaveBeenCalledWith(
          'note-1',
          expect.objectContaining({ content: 'Keep me', resolved: true }),
        );
      });

      it('should throw error if note not found', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockResolvedValue([]);

        await expect(gitHubImplementation.updateNote('posts', 'my-post', 'non-existent', {})).rejects.toThrow(
          'Note with ID non-existent not found',
        );
        expect(mockAPI.updateEntryNote).not.toHaveBeenCalled();
      });

      // Reported as "not found", a failed read would send the editor looking
      // for a note that is still there.
      it('reports a failed read as itself', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockRejectedValue(new Error('Server Error'));

        await expect(gitHubImplementation.updateNote('posts', 'my-post', 'note-1', {})).rejects.toThrow(
          'Server Error',
        );
      });
    });

    describe('deleteNote', () => {
      it('should delete an existing note', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockResolvedValue([
          { id: 'note-1', author: 'user1', content: 'Test note', entrySlug: 'my-post' },
        ]);
        mockAPI.deleteEntryNote.mockResolvedValue(undefined);

        await gitHubImplementation.deleteNote('posts', 'my-post', 'note-1');

        expect(mockAPI.deleteEntryNote).toHaveBeenCalledWith('note-1');
      });

      it('should throw error if note not found', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockResolvedValue([]);

        await expect(gitHubImplementation.deleteNote('posts', 'my-post', 'non-existent')).rejects.toThrow(
          'Note with ID non-existent not found',
        );
        expect(mockAPI.deleteEntryNote).not.toHaveBeenCalled();
      });
    });

    describe('toggleNoteResolution', () => {
      it('should toggle note resolved status from false to true', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockResolvedValue([
          {
            id: 'note-1',
            author: 'user1',
            avatarUrl: 'https://avatar.url',
            content: 'Test note',
            timestamp: '2025-01-01T00:00:00Z',
            resolved: false,
            entrySlug: 'my-post',
          },
        ]);
        mockAPI.updateEntryNote.mockResolvedValue(undefined);

        const result = await gitHubImplementation.toggleNoteResolution('posts', 'my-post', 'note-1');

        expect(result.resolved).toBe(true);
        expect(mockAPI.updateEntryNote).toHaveBeenCalledWith(
          'note-1',
          expect.objectContaining({ resolved: true, content: 'Test note' }),
        );
      });

      it('should toggle note resolved status from true to false', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockResolvedValue([{ id: 'note-1', resolved: true, entrySlug: 'my-post' }]);
        mockAPI.updateEntryNote.mockResolvedValue(undefined);

        const result = await gitHubImplementation.toggleNoteResolution('posts', 'my-post', 'note-1');

        expect(result.resolved).toBe(false);
      });

      it('should throw error if note not found', async () => {
        const gitHubImplementation = backend();

        mockAPI.getEntryNotes.mockResolvedValue([]);

        await expect(gitHubImplementation.toggleNoteResolution('posts', 'my-post', 'non-existent')).rejects.toThrow(
          'Note with ID non-existent not found',
        );
      });
    });

    describe('reopenIssueForUnpublishedEntry', () => {
      it('should reopen issue for unpublished entry', async () => {
        await backend(configWithNotes).reopenIssueForUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.reopenIssueOnUnpublish).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('looks nothing up when no collection uses notes', async () => {
        await backend(config).reopenIssueForUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.reopenIssueOnUnpublish).not.toHaveBeenCalled();
      });
    });

    describe('deleteUnpublishedEntry with notes cleanup', () => {
      it('should delete entry and close associated notes issue', async () => {
        await backend(configWithNotes).deleteUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.deleteUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(mockAPI.closeEntryNotesIssue).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('looks nothing up when no collection uses notes', async () => {
        await backend(config).deleteUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.deleteUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(mockAPI.closeEntryNotesIssue).not.toHaveBeenCalled();
      });
    });

    describe('publishUnpublishedEntry with issue cleanup', () => {
      it('should publish entry and close issue', async () => {
        await backend(configWithNotes).publishUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.publishUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(mockAPI.closeIssueOnPublish).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('closes the thread when only one collection uses notes', async () => {
        const cfg = { ...config, collections: [{ name: 'posts', editor: { notes: true } }] };

        await backend(cfg).publishUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.closeIssueOnPublish).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('closes the thread when only one file uses notes', async () => {
        const cfg = {
          ...config,
          collections: [{ name: 'pages', files: [{ name: 'about', editor: { notes: true } }] }],
        };

        await backend(cfg).publishUnpublishedEntry('pages', 'about');

        expect(mockAPI.closeIssueOnPublish).toHaveBeenCalledWith('pages', 'about');
      });

      it('looks nothing up when no collection uses notes', async () => {
        const cfg = { ...config, collections: [{ name: 'posts' }] };

        await backend(cfg).publishUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.publishUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(mockAPI.closeIssueOnPublish).not.toHaveBeenCalled();
      });
    });

    describe('notes polling', () => {
      it('should start notes polling', async () => {
        const gitHubImplementation = backend();
        gitHubImplementation.pollingManager = {
          watchIssueWithRetry: vi.fn().mockResolvedValue(() => {}),
          getStatus: vi.fn().mockReturnValue({ currentWatch: null }),
        };

        const callbacks = { onUpdate: vi.fn(), onChange: vi.fn() };

        await gitHubImplementation.startNotesPolling('posts', 'my-post', callbacks);

        expect(gitHubImplementation.pollingManager.watchIssueWithRetry).toHaveBeenCalledWith(
          'posts',
          'my-post',
          expect.objectContaining({
            onUpdate: callbacks.onUpdate,
            onChange: callbacks.onChange,
            prepareNotes: expect.any(Function),
          }),
          5,
          2000,
        );

        // The polling manager rebuilds notes from the issue's comments, so they
        // arrive with no ownership flag. Without prepareNotes a poll would strip
        // Edit/Resolve/Delete off the editor's own notes ~15s after they show.
        const [, , passedCallbacks] = gitHubImplementation.pollingManager.watchIssueWithRetry.mock.calls[0];
        const prepared = await passedCallbacks.prepareNotes([
          { id: '1', author: 'user1', content: 'mine', resolved: false },
          { id: '2', author: 'someone-else', content: 'theirs', resolved: false },
        ]);

        expect(prepared).toEqual([
          expect.objectContaining({ id: '1', isOwn: true }),
          expect.objectContaining({ id: '2', isOwn: false }),
        ]);
      });

      it('does nothing before sign-in has set up polling', async () => {
        const gitHubImplementation = backend();
        vi.spyOn(console, 'warn').mockImplementationOnce(() => {});

        await expect(gitHubImplementation.startNotesPolling('posts', 'my-post', {})).resolves.toBeUndefined();
      });

      it('should not start polling if already watching same entry', async () => {
        const gitHubImplementation = backend();
        gitHubImplementation.pollingManager = {
          watchIssueWithRetry: vi.fn().mockResolvedValue(() => {}),
          getStatus: vi.fn().mockReturnValue({ currentWatch: 'posts/my-post' }),
        };

        await gitHubImplementation.startNotesPolling('posts', 'my-post', { onUpdate: vi.fn() });

        expect(gitHubImplementation.pollingManager.watchIssueWithRetry).not.toHaveBeenCalled();
      });

      it('should stop notes polling', async () => {
        const gitHubImplementation = backend();
        const unwatchFn = vi.fn();
        gitHubImplementation.unwatchFunctions.set('posts/my-post', unwatchFn);
        gitHubImplementation.pollingManager = { stopWatching: vi.fn() };

        await gitHubImplementation.stopNotesPolling('posts', 'my-post');

        expect(unwatchFn).toHaveBeenCalledTimes(1);
        expect(gitHubImplementation.unwatchFunctions.has('posts/my-post')).toBe(false);
        // Also cancels a lookup still retrying, which has no unwatch function yet.
        expect(gitHubImplementation.pollingManager.stopWatching).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('should handle stopping polling when not active', async () => {
        await expect(backend().stopNotesPolling('posts', 'my-post')).resolves.toBeUndefined();
      });

      it('should refresh notes immediately', async () => {
        const gitHubImplementation = backend();
        gitHubImplementation.pollingManager = { checkIssueNow: vi.fn().mockResolvedValue(undefined) };

        await gitHubImplementation.refreshNotesNow('posts', 'my-post');

        expect(gitHubImplementation.pollingManager.checkIssueNow).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('should throw error when refreshing without polling manager', async () => {
        const gitHubImplementation = backend();
        gitHubImplementation.pollingManager = undefined;

        await expect(gitHubImplementation.refreshNotesNow('posts', 'my-post')).rejects.toThrow(
          'Polling manager not initialized',
        );
      });

      it('should start polling and store unwatch function', async () => {
        const gitHubImplementation = backend();
        const unwatchFn = vi.fn();

        gitHubImplementation.pollingManager = {
          watchIssueWithRetry: vi.fn().mockResolvedValue(unwatchFn),
          getStatus: vi.fn().mockReturnValue({ currentWatch: null }),
        };

        await gitHubImplementation.startNotesPolling('posts', 'my-post', { onUpdate: vi.fn() });

        expect(gitHubImplementation.unwatchFunctions.get('posts/my-post')).toBe(unwatchFn);
      });

      it('should stop existing polling before starting new one', async () => {
        const gitHubImplementation = backend();
        const oldUnwatchFn = vi.fn();
        const newUnwatchFn = vi.fn();

        gitHubImplementation.unwatchFunctions.set('posts/my-post', oldUnwatchFn);
        gitHubImplementation.pollingManager = {
          watchIssueWithRetry: vi.fn().mockResolvedValue(newUnwatchFn),
          getStatus: vi.fn().mockReturnValue({ currentWatch: 'posts/other-post' }),
        };

        await gitHubImplementation.startNotesPolling('posts', 'my-post', { onUpdate: vi.fn() });

        expect(oldUnwatchFn).toHaveBeenCalledTimes(1);
        expect(gitHubImplementation.unwatchFunctions.get('posts/my-post')).toBe(newUnwatchFn);
      });

      it('should handle polling manager error gracefully', async () => {
        const gitHubImplementation = backend();

        gitHubImplementation.pollingManager = {
          watchIssueWithRetry: vi.fn().mockRejectedValue(new Error('Failed to find issue')),
          getStatus: vi.fn().mockReturnValue({ currentWatch: null }),
        };

        await gitHubImplementation.startNotesPolling('posts', 'my-post', { onUpdate: vi.fn() });

        expect(console.error).toHaveBeenCalledWith(
          '[DecapNotes Polling] Failed to start polling after retries:',
          expect.any(Error),
        );
      });

      it('logout stops polling and drops the manager', async () => {
        const gitHubImplementation = backend();
        const destroy = vi.fn();
        gitHubImplementation.pollingManager = { destroy };
        gitHubImplementation.unwatchFunctions.set('posts/my-post', vi.fn());

        gitHubImplementation.logout();

        expect(destroy).toHaveBeenCalledTimes(1);
        expect(gitHubImplementation.pollingManager).toBeUndefined();
        expect(gitHubImplementation.unwatchFunctions.size).toBe(0);
      });
    });
  });
});
