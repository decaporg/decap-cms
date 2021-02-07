/* eslint-disable @typescript-eslint/no-var-requires */
import Joi from '@hapi/joi';
import { getSchema } from '.';

function assetFailure(result: Joi.ValidationResult, expectedMessage: string) {
  const { error } = result;
  expect(error).not.toBeNull();
  expect(error!.details).toHaveLength(1);
  const message = error!.details.map(({ message }) => message)[0];
  expect(message).toBe(expectedMessage);
}

const defaultParams = {
  branch: 'master',
};

describe('localFsMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSchema', () => {
    it('should throw on path traversal', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });

      assetFailure(
        schema.validate({
          action: 'getEntry',
          params: { ...defaultParams, path: '../' },
        }),
        '"params.path" must resolve to a path under the configured repository',
      );
    });

    it('should not throw on valid path', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });

      const { error } = schema.validate({
        action: 'getEntry',
        params: { ...defaultParams, path: 'src/content/posts/title.md' },
      });

      expect(error).toBeUndefined();
    });

    it('should throw on folder traversal', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });

      assetFailure(
        schema.validate({
          action: 'entriesByFolder',
          params: { ...defaultParams, folder: '../', extension: 'md', depth: 1 },
        }),
        '"params.folder" must resolve to a path under the configured repository',
      );
    });

    it('should not throw on valid folder', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });

      const { error } = schema.validate({
        action: 'entriesByFolder',
        params: { ...defaultParams, folder: 'src/posts', extension: 'md', depth: 1 },
      });

      expect(error).toBeUndefined();
    });

    it('should throw on media folder traversal', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });

      assetFailure(
        schema.validate({
          action: 'getMedia',
          params: { ...defaultParams, mediaFolder: '../' },
        }),
        '"params.mediaFolder" must resolve to a path under the configured repository',
      );
    });

    it('should not throw on valid folder', () => {
      const schema = getSchema({ repoPath: '/Users/user/documents/code/repo' });
      const { error } = schema.validate({
        action: 'getMedia',
        params: { ...defaultParams, mediaFolder: 'static/images' },
      });

      expect(error).toBeUndefined();
    });
  });
});
