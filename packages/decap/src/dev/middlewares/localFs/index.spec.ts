/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../utils/fs.js', () => ({
  ...jest.requireActual('../utils/fs.js'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  move: jest.fn(),
}));

import { getSchema, localFsMiddleware } from './index.js';
import { move } from '../utils/fs.js';

import type Joi from '@hapi/joi';
import type express from 'express';
import type winston from 'winston';

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

  describe('persistEntry with a rename', () => {
    it('awaits the move before responding, so the response implies the rename is done', async () => {
      const order: string[] = [];
      (move as jest.Mock).mockImplementation(async () => {
        order.push('move-start');
        await new Promise(resolve => setTimeout(resolve, 0));
        order.push('move-end');
      });
      const logger = { error: jest.fn() } as unknown as winston.Logger;
      const middleware = localFsMiddleware({ repoPath: '/repo', logger });
      const req = {
        body: {
          action: 'persistEntry',
          params: {
            entry: { slug: 'a', path: 'a.md', raw: 'x', newPath: 'b.md' },
            assets: [],
            options: {},
          },
        },
      } as unknown as express.Request;
      const res = { json: jest.fn(() => order.push('json')) } as unknown as express.Response;

      await middleware(req, res);

      expect(order).toEqual(['move-start', 'move-end', 'json']);
    });
  });
});
