import { getSchema } from './localGitMiddleware';

describe('localGitMiddleware', () => {
  describe('getSchema', () => {
    it('should throw on path traversal', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });
      const { error } = schema.validate({ action: 'getEntry', params: { path: '../' } });

      expect(error).not.toBeNull();
      expect(error.details).toHaveLength(1);
      const message = error.details.map(({ message }) => message)[0];
      expect(message).toBe('"params.path" must resolve to a path under the configured repository');
    });

    it('should not throw on valid path', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });
      const { error } = schema.validate({
        action: 'getEntry',
        params: { path: 'src/content/posts/title.md' },
      });

      expect(error).toBeUndefined();
    });

    it('should throw on folder traversal', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });
      const { error } = schema.validate({
        action: 'entriesByFolder',
        params: { folder: '../', extension: 'md', depth: 1 },
      });

      expect(error).not.toBeNull();
      expect(error.details).toHaveLength(1);
      const message = error.details.map(({ message }) => message)[0];
      expect(message).toBe(
        '"params.folder" must resolve to a path under the configured repository',
      );
    });

    it('should not throw on valid folder', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });
      const { error } = schema.validate({
        action: 'entriesByFolder',
        params: { folder: 'src/posts', extension: 'md', depth: 1 },
      });

      expect(error).toBeUndefined();
    });

    it('should throw on media folder traversal', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });
      const { error } = schema.validate({
        action: 'getMedia',
        params: { mediaFolder: '../' },
      });

      expect(error).not.toBeNull();
      expect(error.details).toHaveLength(1);
      const message = error.details.map(({ message }) => message)[0];
      expect(message).toBe(
        '"params.mediaFolder" must resolve to a path under the configured repository',
      );
    });

    it('should not throw on valid folder', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });
      const { error } = schema.validate({
        action: 'getMedia',
        params: { mediaFolder: 'static/images' },
      });

      expect(error).toBeUndefined();
    });
  });
});
