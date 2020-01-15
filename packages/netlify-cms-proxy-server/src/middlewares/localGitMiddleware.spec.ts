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
  });
});
