import TestBackend, { getFolderFiles } from '../implementation';

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

      const backend = new TestBackend({});

      await expect(backend.getEntry('posts/some-post.md')).resolves.toEqual({
        file: { path: 'posts/some-post.md', id: null },
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

      const backend = new TestBackend({});

      await expect(backend.getEntry('posts/dir1/dir2/some-post.md')).resolves.toEqual({
        file: { path: 'posts/dir1/dir2/some-post.md', id: null },
        data: 'post content',
      });
    });
  });

  describe('persistEntry', () => {
    it('should persist entry', async () => {
      window.repoFiles = {};

      const backend = new TestBackend({});

      const entry = {
        dataFiles: [{ path: 'posts/some-post.md', raw: 'content', slug: 'some-post.md' }],
        assets: [],
      };
      await backend.persistEntry(entry, { newEntry: true });

      expect(window.repoFiles).toEqual({
        posts: {
          'some-post.md': {
            content: 'content',
            path: 'posts/some-post.md',
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

      const backend = new TestBackend({});

      const entry = {
        dataFiles: [{ path: 'posts/new-post.md', raw: 'content', slug: 'new-post.md' }],
        assets: [],
      };
      await backend.persistEntry(entry, { newEntry: true });

      expect(window.repoFiles).toEqual({
        pages: {
          'other-page.md': {
            content: 'content',
          },
        },
        posts: {
          'new-post.md': {
            content: 'content',
            path: 'posts/new-post.md',
          },
          'other-post.md': {
            content: 'content',
          },
        },
      });
    });

    it('should persist nested entry', async () => {
      window.repoFiles = {};

      const backend = new TestBackend({});

      const slug = 'dir1/dir2/some-post.md';
      const path = `posts/${slug}`;
      const entry = { dataFiles: [{ path, raw: 'content', slug }], assets: [] };
      await backend.persistEntry(entry, { newEntry: true });

      expect(window.repoFiles).toEqual({
        posts: {
          dir1: {
            dir2: {
              'some-post.md': {
                content: 'content',
                path: 'posts/dir1/dir2/some-post.md',
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

      const backend = new TestBackend({});

      const slug = 'dir1/dir2/some-post.md';
      const path = `posts/${slug}`;
      const entry = { dataFiles: [{ path, raw: 'new content', slug }], assets: [] };
      await backend.persistEntry(entry, { newEntry: false });

      expect(window.repoFiles).toEqual({
        posts: {
          dir1: {
            dir2: {
              'some-post.md': {
                path: 'posts/dir1/dir2/some-post.md',
                content: 'new content',
              },
            },
          },
        },
      });
    });
  });

  describe('deleteFiles', () => {
    it('should delete entry by path', async () => {
      window.repoFiles = {
        posts: {
          'some-post.md': {
            content: 'post content',
          },
        },
      };

      const backend = new TestBackend({});

      await backend.deleteFiles(['posts/some-post.md']);
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

      const backend = new TestBackend({});

      await backend.deleteFiles(['posts/dir1/dir2/some-post.md']);
      expect(window.repoFiles).toEqual({
        posts: {
          dir1: {
            dir2: {},
          },
        },
      });
    });
  });

  describe('getFolderFiles', () => {
    it('should get files by depth', () => {
      const tree = {
        pages: {
          'root-page.md': {
            content: 'root page content',
          },
          dir1: {
            'nested-page-1.md': {
              content: 'nested page 1 content',
            },
            dir2: {
              'nested-page-2.md': {
                content: 'nested page 2 content',
              },
            },
          },
        },
      };

      expect(getFolderFiles(tree, 'pages', 'md', 1)).toEqual([
        {
          path: 'pages/root-page.md',
          content: 'root page content',
        },
      ]);
      expect(getFolderFiles(tree, 'pages', 'md', 2)).toEqual([
        {
          path: 'pages/dir1/nested-page-1.md',
          content: 'nested page 1 content',
        },
        {
          path: 'pages/root-page.md',
          content: 'root page content',
        },
      ]);
      expect(getFolderFiles(tree, 'pages', 'md', 3)).toEqual([
        {
          path: 'pages/dir1/dir2/nested-page-2.md',
          content: 'nested page 2 content',
        },
        {
          path: 'pages/dir1/nested-page-1.md',
          content: 'nested page 1 content',
        },
        {
          path: 'pages/root-page.md',
          content: 'root page content',
        },
      ]);
    });
  });

  describe('Notes functionality', () => {
    let backend;

    beforeEach(() => {
      window.repoFiles = {};
      backend = new TestBackend({ media_folder: 'uploads' });
    });

    describe('saveNotesFile', () => {
      it('should save notes to the correct path', async () => {
        const notes = [
          {
            id: 'note-1',
            content: 'This is my first note',
            timestamp: '2024-01-15T10:30:00Z',
            author: 'John Doe',
            entrySlug: 'my-first-post',
            resolved: false
          },
          {
            id: 'note-2', 
            content: 'This is a resolved note',
            timestamp: '2024-01-15T11:45:00Z',
            author: 'Jane Smith',
            entrySlug: 'my-first-post',
            resolved: true
          }
        ];

        await backend.saveNotesFile('.notes/blog/my-first-post.json', notes);

        expect(window.repoFiles).toEqual({
          '.notes': {
            blog: {
              'my-first-post.json': {
                path: '.notes/blog/my-first-post.json',
                content: JSON.stringify(notes, null, 2)
              }
            }
          }
        });
      });

      it('should save notes for nested collections', async () => {
        const notes = [
          {
            id: 'note-1',
            content: 'Note for nested entry',
            timestamp: '2024-01-15T10:30:00Z',
            author: 'John Doe',
            entrySlug: 'nested-entry',
            resolved: false
          }
        ];

        await backend.saveNotesFile('.notes/projects/web-development/nested-entry.json', notes);

        expect(window.repoFiles).toEqual({
          '.notes': {
            projects: {
              'web-development': {
                'nested-entry.json': {
                  path: '.notes/projects/web-development/nested-entry.json',
                  content: JSON.stringify(notes, null, 2)
                }
              }
            }
          }
        });
      });

      it('should save empty notes array', async () => {
        await backend.saveNotesFile('.notes/blog/empty-post.json', []);

        expect(window.repoFiles['.notes']['blog']['empty-post.json'].content).toBe('[]');
      });

      it('should preserve other files when saving notes', async () => {
        // Setup existing content
        window.repoFiles = {
          posts: {
            'existing-post.md': {
              content: 'existing content',
              path: 'posts/existing-post.md'
            }
          },
          '.notes': {
            blog: {
              'other-post.json': {
                content: '[]',
                path: '.notes/blog/other-post.json'
              }
            }
          }
        };

        const notes = [{ id: 'note-1', content: 'New note', timestamp: '2024-01-15T10:30:00Z', author: 'John', entrySlug: 'new-post', resolved: false }];
        await backend.saveNotesFile('.notes/blog/new-post.json', notes);

        // Should preserve existing content
        expect(window.repoFiles.posts['existing-post.md']).toBeDefined();
        expect(window.repoFiles['.notes'].blog['other-post.json']).toBeDefined();
        expect(window.repoFiles['.notes'].blog['new-post.json']).toBeDefined();
      });
    });

    describe('getNotesFile', () => {
      it('should load existing notes', async () => {
        const notes = [
          {
            id: 'note-1',
            content: 'Test note content',
            timestamp: '2024-01-15T10:30:00Z',
            author: 'John Doe',
            entrySlug: 'test-post',
            resolved: false
          }
        ];

        // Setup notes in window.repoFiles
        window.repoFiles = {
          '.notes': {
            blog: {
              'test-post.json': {
                path: '.notes/blog/test-post.json',
                content: JSON.stringify(notes)
              }
            }
          }
        };

        const loadedNotes = await backend.getNotesFile('.notes/blog/test-post.json');
        expect(loadedNotes).toEqual(notes);
      });

      it('should return empty array for non-existent notes file', async () => {
        const loadedNotes = await backend.getNotesFile('.notes/blog/non-existent.json');
        expect(loadedNotes).toEqual([]);
      });

      it('should return empty array for empty notes file', async () => {
        window.repoFiles = {
          '.notes': {
            blog: {
              'empty.json': {
                path: '.notes/blog/empty.json',
                content: '[]'
              }
            }
          }
        };

        const loadedNotes = await backend.getNotesFile('.notes/blog/empty.json');
        expect(loadedNotes).toEqual([]);
      });

      it('should handle malformed JSON gracefully', async () => {
        window.repoFiles = {
          '.notes': {
            blog: {
              'corrupted.json': {
                path: '.notes/blog/corrupted.json',
                content: '{ invalid json'
              }
            }
          }
        };

        const loadedNotes = await backend.getNotesFile('.notes/blog/corrupted.json');
        expect(loadedNotes).toEqual([]);
      });
    });

    describe('notes save and load cycle', () => {
      it('should save and then load the same notes', async () => {
        const originalNotes = [
          {
            id: 'note-1',
            content: 'First note',
            timestamp: '2024-01-15T10:30:00Z',
            author: 'John Doe',
            entrySlug: 'test-entry',
            resolved: false
          },
          {
            id: 'note-2',
            content: 'Second note with special chars: éñ中文',
            timestamp: '2024-01-15T11:30:00Z',
            author: 'Jane Smith',
            entrySlug: 'test-entry',
            resolved: true
          }
        ];

        // Save notes
        await backend.saveNotesFile('.notes/blog/test-entry.json', originalNotes);

        // Load notes
        const loadedNotes = await backend.getNotesFile('.notes/blog/test-entry.json');

        expect(loadedNotes).toEqual(originalNotes);
      });

      it('should handle multiple collections separately', async () => {
        const blogNotes = [{ id: 'blog-note', content: 'Blog note', timestamp: '2024-01-15T10:30:00Z', author: 'John', entrySlug: 'blog-post', resolved: false }];
        const pageNotes = [{ id: 'page-note', content: 'Page note', timestamp: '2024-01-15T11:30:00Z', author: 'Jane', entrySlug: 'about-page', resolved: false }];

        // Save to different collections
        await backend.saveNotesFile('.notes/blog/my-post.json', blogNotes);
        await backend.saveNotesFile('.notes/pages/about.json', pageNotes);

        // Load from different collections
        const loadedBlogNotes = await backend.getNotesFile('.notes/blog/my-post.json');
        const loadedPageNotes = await backend.getNotesFile('.notes/pages/about.json');

        expect(loadedBlogNotes).toEqual(blogNotes);
        expect(loadedPageNotes).toEqual(pageNotes);
      });
    });

    describe('edge cases', () => {
      it('should handle notes with complex content', async () => {
        const complexNotes = [
          {
            id: 'complex-note',
            content: 'Note with "quotes", line\nbreaks, and {json: "like"} content',
            timestamp: '2024-01-15T10:30:00Z',
            author: 'Test User',
            entrySlug: 'complex-entry',
            resolved: false
          }
        ];

        await backend.saveNotesFile('.notes/blog/complex.json', complexNotes);
        const loadedNotes = await backend.getNotesFile('.notes/blog/complex.json');

        expect(loadedNotes).toEqual(complexNotes);
      });
    });
  })
});
