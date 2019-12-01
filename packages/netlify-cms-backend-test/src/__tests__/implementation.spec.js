import TestBackend from '../implementation';

describe('test backend implementation', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('getEntry', () => {
    it('should get entry by path', async () => {
      window.repoFiles = {
        posts: {
          'some-post.md': {
            content: 'post content',
          },
        },
      };

      const backend = new TestBackend();

      await expect(backend.getEntry(null, null, 'posts/some-post.md')).resolves.toEqual({
        file: { path: 'posts/some-post.md' },
        data: 'post content',
      });
    });

    it('should get entry by nested path', async () => {
      window.repoFiles = {
        posts: {
          dir1: {
            dir2: {
              'some-post.md': {
                content: 'post content',
              },
            },
          },
        },
      };

      const backend = new TestBackend();

      await expect(backend.getEntry(null, null, 'posts/dir1/dir2/some-post.md')).resolves.toEqual({
        file: { path: 'posts/dir1/dir2/some-post.md' },
        data: 'post content',
      });
    });
  });

  describe('persistEntry', () => {
    it('should persist entry', async () => {
      window.repoFiles = {};

      const backend = new TestBackend();

      const entry = { path: 'posts/some-post.md', raw: 'content', slug: 'some-post.md' };
      await backend.persistEntry(entry, [], { newEntry: true });

      expect(window.repoFiles).toEqual({
        posts: {
          'some-post.md': {
            content: 'content',
          },
        },
      });
    });

    it('should persist entry and keep existing unrelated entries', async () => {
      window.repoFiles = {
        pages: {
          'other-page.md': {
            content: 'content',
          },
        },
        posts: {
          'other-post.md': {
            content: 'content',
          },
        },
      };

      const backend = new TestBackend();

      const entry = { path: 'posts/new-post.md', raw: 'content', slug: 'new-post.md' };
      await backend.persistEntry(entry, [], { newEntry: true });

      expect(window.repoFiles).toEqual({
        pages: {
          'other-page.md': {
            content: 'content',
          },
        },
        posts: {
          'new-post.md': {
            content: 'content',
          },
          'other-post.md': {
            content: 'content',
          },
        },
      });
    });

    it('should persist nested entry', async () => {
      window.repoFiles = {};

      const backend = new TestBackend();

      const slug = 'dir1/dir2/some-post.md';
      const path = `posts/${slug}`;
      const entry = { path, raw: 'content', slug };
      await backend.persistEntry(entry, [], { newEntry: true });

      expect(window.repoFiles).toEqual({
        posts: {
          dir1: {
            dir2: {
              'some-post.md': {
                content: 'content',
              },
            },
          },
        },
      });
    });

    it('should update existing nested entry', async () => {
      window.repoFiles = {
        posts: {
          dir1: {
            dir2: {
              'some-post.md': {
                mediaFiles: ['file1'],
                content: 'content',
              },
            },
          },
        },
      };

      const backend = new TestBackend();

      const slug = 'dir1/dir2/some-post.md';
      const path = `posts/${slug}`;
      const entry = { path, raw: 'new content', slug };
      await backend.persistEntry(entry, [], { newEntry: false });

      expect(window.repoFiles).toEqual({
        posts: {
          dir1: {
            dir2: {
              'some-post.md': {
                mediaFiles: ['file1'],
                content: 'new content',
              },
            },
          },
        },
      });
    });
  });

  describe('deleteFile', () => {
    it('should delete entry by path', async () => {
      window.repoFiles = {
        posts: {
          'some-post.md': {
            content: 'post content',
          },
        },
      };

      const backend = new TestBackend();

      await backend.deleteFile('posts/some-post.md');
      expect(window.repoFiles).toEqual({
        posts: {},
      });
    });

    it('should delete entry by nested path', async () => {
      window.repoFiles = {
        posts: {
          dir1: {
            dir2: {
              'some-post.md': {
                content: 'post content',
              },
            },
          },
        },
      };

      const backend = new TestBackend();

      await backend.deleteFile('posts/dir1/dir2/some-post.md');
      expect(window.repoFiles).toEqual({
        posts: {
          dir1: {
            dir2: {},
          },
        },
      });
    });
  });
});
