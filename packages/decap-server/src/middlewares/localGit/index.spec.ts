/* eslint-disable @typescript-eslint/no-var-requires */
import winston from 'winston';

import { validateRepo, getSchema, localGitMiddleware } from '.';

import type Joi from '@hapi/joi';
import type express from 'express';

jest.mock('decap-cms-lib-util', () => jest.fn());
jest.mock('simple-git');

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

describe('localGitMiddleware', () => {
  const simpleGit = require('simple-git');

  const git = {
    checkIsRepo: jest.fn(),
    silent: jest.fn(),
    branchLocal: jest.fn(),
    checkout: jest.fn(),
  };
  git.silent.mockReturnValue(git);

  simpleGit.mockReturnValue(git);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRepo', () => {
    it('should throw on non valid git repo', async () => {
      git.checkIsRepo.mockResolvedValue(false);
      await expect(validateRepo({ repoPath: '/Users/user/code/repo' })).rejects.toEqual(
        new Error('/Users/user/code/repo is not a valid git repository'),
      );
    });

    it('should not throw on valid git repo', async () => {
      git.checkIsRepo.mockResolvedValue(true);
      await expect(validateRepo({ repoPath: '/Users/user/code/repo' })).resolves.toBeUndefined();
    });
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

  describe('localGitMiddleware', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res: express.Response = { status } as unknown as express.Response;

    const repoPath = '.';

    it("should return error when default branch doesn't exist", async () => {
      git.branchLocal.mockResolvedValue({ all: ['master'] });

      const req = {
        body: {
          action: 'getMedia',
          params: {
            mediaFolder: 'mediaFolder',
            branch: 'develop',
          },
        },
      } as express.Request;

      await localGitMiddleware({ repoPath, logger: winston.createLogger() })(req, res);

      expect(status).toHaveBeenCalledTimes(1);
      expect(status).toHaveBeenCalledWith(422);

      expect(json).toHaveBeenCalledTimes(1);
      expect(json).toHaveBeenCalledWith({ error: "Default branch 'develop' doesn't exist" });
    });
  });
});
