import { Cursor, CURSOR_COMPATIBILITY_SYMBOL } from 'decap-cms-lib-util';

import GitHubImplementation from '../implementation';

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('github backend implementation', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      open_authoring: false,
      api_root: 'https://api.github.com',
    },
  };

  const configWithNotes = {
    backend: {
      repo: 'owner/repo',
      open_authoring: false,
      api_root: 'https://api.github.com',
    },
    editor: {
      notes: true,
    },
  };

  const createObjectURL = jest.fn();
  global.URL = {
    createObjectURL,
  };

  createObjectURL.mockReturnValue('displayURL');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('forkExists', () => {
    it('should return true when repo is fork and parent matches originRepo', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'login' });

      global.fetch = jest.fn().mockResolvedValue({
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
      gitHubImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'login' });

      global.fetch = jest.fn().mockResolvedValue({
        // matching should be case-insensitive
        json: () => ({ fork: false }),
      });

      expect.assertions(1);
      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(false);
    });

    it("should return false when parent doesn't match originRepo", async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'login' });

      global.fetch = jest.fn().mockResolvedValue({
        json: () => ({ fork: true, parent: { full_name: 'owner/other_repo' } }),
      });

      expect.assertions(1);
      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(false);
    });
  });

  describe('persistMedia', () => {
    const persistFiles = jest.fn();
    const mockAPI = {
      persistFiles,
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
    const generateContentKey = jest.fn();
    const retrieveUnpublishedEntryData = jest.fn();

    const mockAPI = {
      generateContentKey,
      retrieveUnpublishedEntryData,
    };

    it('should return unpublished entry data', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;
      gitHubImplementation.loadEntryMediaFiles = jest
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
    const listFiles = jest.fn();
    const readFile = jest.fn();
    const readFileMetadata = jest.fn(() => Promise.resolve({ author: '', updatedOn: '' }));

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
        .map(({ id, path }) => ({ data: id, file: { path, id, author: '', updatedOn: '' } }));

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
    const listFiles = jest.fn();
    const readFile = jest.fn((path, id) => Promise.resolve(`${id}`));
    const readFileMetadata = jest.fn(() => Promise.resolve({}));

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
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

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
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

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
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

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
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

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
    const mockAPI = {
      getEntryNotes: jest.fn(),
      addNoteToEntry: jest.fn(),
      updateEntryNote: jest.fn(),
      deleteEntryNote: jest.fn(),
      closeEntryNotesIssue: jest.fn(),
      closeIssueOnPublish: jest.fn(),
      reopenIssueOnUnpublish: jest.fn(),
      readFile: jest.fn(),
      deleteUnpublishedEntry: jest.fn().mockResolvedValue(undefined),
      publishUnpublishedEntry: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('getNotes', () => {
      it('should retrieve notes for an entry', async () => {
        const gitHubImplementation = new GitHubImplementation(configWithNotes);
        gitHubImplementation.api = mockAPI;

        const mockNotes = [
          {
            id: '1',
            author: 'user1',
            avatarUrl: 'https://avatar.url',
            text: 'Test note',
            timestamp: '2025-01-01T00:00:00Z',
            resolved: false,
          },
        ];

        mockAPI.getEntryNotes.mockResolvedValue(mockNotes);

        const result = await gitHubImplementation.getNotes('posts', 'my-post');

        expect(result).toEqual([
          {
            ...mockNotes[0],
            entrySlug: 'my-post',
          },
        ]);
        expect(mockAPI.getEntryNotes).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('should return empty array on error', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        mockAPI.getEntryNotes.mockRejectedValue(new Error('API Error'));

        const result = await gitHubImplementation.getNotes('posts', 'my-post');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Failed to get notes:', expect.any(Error));
      });
    });

    describe('addNote', () => {
      it('should add a note to an entry', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;
        gitHubImplementation.token = 'test-token';
        gitHubImplementation.currentUser = jest.fn().mockResolvedValue({
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://avatar.url',
        });

        const noteData = {
          text: 'New note',
          timestamp: '2025-01-01T00:00:00Z',
          resolved: false,
        };

        mockAPI.addNoteToEntry.mockResolvedValue('comment-123');
        mockAPI.readFile.mockResolvedValue('title: My Post Title\n\nContent');

        const result = await gitHubImplementation.addNote('posts', 'my-post', noteData);

        expect(result).toMatchObject({
          text: 'New note',
          author: 'testuser',
          avatarUrl: 'https://avatar.url',
          entrySlug: 'my-post',
          resolved: false,
          id: 'comment-123',
        });
        expect(mockAPI.addNoteToEntry).toHaveBeenCalledWith(
          'posts',
          'my-post',
          expect.objectContaining({
            text: 'New note',
            author: 'testuser',
          }),
          'My Post Title',
        );
      });

      it('should handle missing entry title gracefully', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;
        gitHubImplementation.token = 'test-token';
        gitHubImplementation.currentUser = jest.fn().mockResolvedValue({
          login: 'testuser',
          avatar_url: 'https://avatar.url',
        });

        const noteData = {
          text: 'New note',
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockAPI.addNoteToEntry.mockResolvedValue('comment-123');
        mockAPI.readFile.mockRejectedValue(new Error('Not found'));

        const result = await gitHubImplementation.addNote('posts', 'my-post', noteData);

        expect(mockAPI.addNoteToEntry).toHaveBeenCalledWith(
          'posts',
          'my-post',
          expect.any(Object),
          undefined,
        );
        expect(result.id).toBe('comment-123');
      });
    });

    describe('updateNote', () => {
      it('should update an existing note', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        const existingNotes = [
          {
            id: 'note-1',
            author: 'user1',
            avatarUrl: 'https://avatar.url',
            text: 'Original text',
            timestamp: '2025-01-01T00:00:00Z',
            resolved: false,
            entrySlug: 'my-post',
          },
        ];

        mockAPI.getEntryNotes.mockResolvedValue(existingNotes);
        mockAPI.updateEntryNote.mockResolvedValue(undefined);

        const updates = { text: 'Updated text', resolved: true };
        const result = await gitHubImplementation.updateNote('posts', 'my-post', 'note-1', updates);

        expect(result).toEqual({
          ...existingNotes[0],
          text: 'Updated text',
          resolved: true,
        });
        expect(mockAPI.updateEntryNote).toHaveBeenCalledWith('note-1', result);
      });

      it('should throw error if note not found', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        mockAPI.getEntryNotes.mockResolvedValue([]);

        await expect(
          gitHubImplementation.updateNote('posts', 'my-post', 'non-existent', {}),
        ).rejects.toThrow('Note with ID non-existent not found');
      });
    });

    describe('deleteNote', () => {
      it('should delete an existing note', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        const existingNotes = [
          {
            id: 'note-1',
            author: 'user1',
            text: 'Test note',
            entrySlug: 'my-post',
          },
        ];

        mockAPI.getEntryNotes.mockResolvedValue(existingNotes);
        mockAPI.deleteEntryNote.mockResolvedValue(undefined);

        await gitHubImplementation.deleteNote('posts', 'my-post', 'note-1');

        expect(mockAPI.deleteEntryNote).toHaveBeenCalledWith('note-1');
      });

      it('should throw error if note not found', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        mockAPI.getEntryNotes.mockResolvedValue([]);

        await expect(
          gitHubImplementation.deleteNote('posts', 'my-post', 'non-existent'),
        ).rejects.toThrow('Note with ID non-existent not found');
      });
    });

    describe('toggleNoteResolution', () => {
      it('should toggle note resolved status from false to true', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        const existingNotes = [
          {
            id: 'note-1',
            author: 'user1',
            avatarUrl: 'https://avatar.url',
            text: 'Test note',
            timestamp: '2025-01-01T00:00:00Z',
            resolved: false,
            entrySlug: 'my-post',
          },
        ];

        mockAPI.getEntryNotes.mockResolvedValue(existingNotes);
        mockAPI.updateEntryNote.mockResolvedValue(undefined);

        const result = await gitHubImplementation.toggleNoteResolution(
          'posts',
          'my-post',
          'note-1',
        );

        expect(result.resolved).toBe(true);
        expect(mockAPI.updateEntryNote).toHaveBeenCalledWith(
          'note-1',
          expect.objectContaining({ resolved: true }),
        );
      });

      it('should toggle note resolved status from true to false', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        const existingNotes = [
          {
            id: 'note-1',
            resolved: true,
            entrySlug: 'my-post',
          },
        ];

        mockAPI.getEntryNotes.mockResolvedValue(existingNotes);
        mockAPI.updateEntryNote.mockResolvedValue(undefined);

        const result = await gitHubImplementation.toggleNoteResolution(
          'posts',
          'my-post',
          'note-1',
        );

        expect(result.resolved).toBe(false);
      });

      it('should throw error if note not found', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        mockAPI.getEntryNotes.mockResolvedValue([]);

        await expect(
          gitHubImplementation.toggleNoteResolution('posts', 'my-post', 'non-existent'),
        ).rejects.toThrow('Note with ID non-existent not found');
      });
    });

    describe('reopenIssueForUnpublishedEntry', () => {
      it('should reopen issue for unpublished entry', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        mockAPI.reopenIssueOnUnpublish.mockResolvedValue(undefined);

        await gitHubImplementation.reopenIssueForUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.reopenIssueOnUnpublish).toHaveBeenCalledWith('posts', 'my-post');
      });
    });

    describe('deleteUnpublishedEntry with notes cleanup', () => {
      it('should delete entry and close associated notes issue', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI; // Just use mockAPI directly

        await gitHubImplementation.deleteUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.deleteUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(mockAPI.closeEntryNotesIssue).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('should continue deletion even if closing issue fails', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;
        mockAPI.closeEntryNotesIssue.mockRejectedValue(new Error('Issue close failed'));

        await gitHubImplementation.deleteUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.deleteUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
      });
    });

    describe('publishUnpublishedEntry with issue cleanup', () => {
      it('should publish entry and close issue', async () => {
        const gitHubImplementation = new GitHubImplementation(config);
        gitHubImplementation.api = mockAPI;

        await gitHubImplementation.publishUnpublishedEntry('posts', 'my-post');

        expect(mockAPI.publishUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(mockAPI.closeIssueOnPublish).toHaveBeenCalledWith('posts', 'my-post');
      });
    });
  });
});
