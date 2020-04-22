import { defaultSchema, joi } from '.';
import express from 'express';
import Joi from '@hapi/joi';

const assetFailure = (result: Joi.ValidationResult, expectedMessage: string) => {
  const { error } = result;
  expect(error).not.toBeNull();
  expect(error.details).toHaveLength(1);
  const message = error.details.map(({ message }) => message)[0];
  expect(message).toBe(expectedMessage);
};

const defaultParams = {
  branch: 'master',
};

describe('defaultSchema', () => {
  it('should fail on unsupported body', () => {
    const schema = defaultSchema();

    assetFailure(schema.validate({}), '"action" is required');
  });

  it('should fail on unsupported action', () => {
    const schema = defaultSchema();

    assetFailure(
      schema.validate({ action: 'unknown', params: {} }),
      '"action" must be one of [info, entriesByFolder, entriesByFiles, getEntry, unpublishedEntries, unpublishedEntry, deleteUnpublishedEntry, persistEntry, updateUnpublishedEntryStatus, publishUnpublishedEntry, getMedia, getMediaFile, persistMedia, deleteFile, getDeployPreview]',
    );
  });

  describe('info', () => {
    it('should pass with no params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'info',
      });

      expect(error).toBeUndefined();
    });
  });

  describe('entriesByFolder', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'entriesByFolder', params: { ...defaultParams } }),
        '"params.folder" is required',
      );
      assetFailure(
        schema.validate({
          action: 'entriesByFolder',
          params: { ...defaultParams, folder: 'folder' },
        }),
        '"params.extension" is required',
      );
      assetFailure(
        schema.validate({
          action: 'entriesByFolder',
          params: { ...defaultParams, folder: 'folder', extension: 'md' },
        }),
        '"params.depth" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'entriesByFolder',
        params: { ...defaultParams, folder: 'folder', extension: 'md', depth: 1 },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('entriesByFiles', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'entriesByFiles', params: { ...defaultParams } }),
        '"params.files" is required',
      );
      assetFailure(
        schema.validate({ action: 'entriesByFiles', params: { ...defaultParams, files: {} } }),
        '"params.files" must be an array',
      );
      assetFailure(
        schema.validate({
          action: 'entriesByFiles',
          params: { ...defaultParams, files: [{ id: 'id' }] },
        }),
        '"params.files[0].path" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'entriesByFiles',
        params: { ...defaultParams, files: [{ path: 'path' }] },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getEntry', params: { ...defaultParams } }),
        '"params.path" is required',
      );
      assetFailure(
        schema.validate({ action: 'getEntry', params: { ...defaultParams, path: 1 } }),
        '"params.path" must be a string',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getEntry',
        params: { ...defaultParams, path: 'path' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('unpublishedEntries', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'unpublishedEntries', params: {} }),
        '"params.branch" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'unpublishedEntries',
        params: { ...defaultParams, branch: 'master' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('unpublishedEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'unpublishedEntry', params: { ...defaultParams } }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'unpublishedEntry',
          params: { ...defaultParams, collection: 'collection' },
        }),
        '"params.slug" is required',
      );
      assetFailure(
        schema.validate({
          action: 'unpublishedEntry',
          params: { ...defaultParams, collection: 'collection', slug: 1 },
        }),
        '"params.slug" must be a string',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'unpublishedEntry',
        params: { ...defaultParams, collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('deleteUnpublishedEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'deleteUnpublishedEntry', params: { ...defaultParams } }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'deleteUnpublishedEntry',
          params: { ...defaultParams, collection: 'collection' },
        }),
        '"params.slug" is required',
      );
      assetFailure(
        schema.validate({
          action: 'deleteUnpublishedEntry',
          params: { ...defaultParams, collection: 'collection', slug: 1 },
        }),
        '"params.slug" must be a string',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'deleteUnpublishedEntry',
        params: { ...defaultParams, collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('persistEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'persistEntry', params: { ...defaultParams } }),
        '"params.entry" is required',
      );
      assetFailure(
        schema.validate({
          action: 'persistEntry',
          params: { ...defaultParams, entry: { slug: 'slug', path: 'path', raw: 'content' } },
        }),
        '"params.assets" is required',
      );
      assetFailure(
        schema.validate({
          action: 'persistEntry',
          params: {
            ...defaultParams,
            entry: { slug: 'slug', path: 'path', raw: 'content' },
            assets: [],
          },
        }),
        '"params.options" is required',
      );
      assetFailure(
        schema.validate({
          action: 'persistEntry',
          params: {
            ...defaultParams,
            entry: { slug: 'slug', path: 'path', raw: 'content' },
            assets: [],
            options: {},
          },
        }),
        '"params.options.commitMessage" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'persistEntry',
        params: {
          ...defaultParams,
          entry: { slug: 'slug', path: 'path', raw: 'content' },
          assets: [{ path: 'path', content: 'content', encoding: 'base64' }],
          options: {
            commitMessage: 'commitMessage',
            useWorkflow: true,
            status: 'draft',
          },
        },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('updateUnpublishedEntryStatus', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'updateUnpublishedEntryStatus', params: { ...defaultParams } }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'updateUnpublishedEntryStatus',
          params: { ...defaultParams, collection: 'collection' },
        }),
        '"params.slug" is required',
      );
      assetFailure(
        schema.validate({
          action: 'updateUnpublishedEntryStatus',
          params: { ...defaultParams, collection: 'collection', slug: 'slug' },
        }),
        '"params.newStatus" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'updateUnpublishedEntryStatus',
        params: { ...defaultParams, collection: 'collection', slug: 'slug', newStatus: 'draft' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('publishUnpublishedEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'publishUnpublishedEntry', params: { ...defaultParams } }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'publishUnpublishedEntry',
          params: { ...defaultParams, collection: 'collection' },
        }),
        '"params.slug" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'publishUnpublishedEntry',
        params: { ...defaultParams, collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getMedia', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getMedia', params: { ...defaultParams } }),
        '"params.mediaFolder" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getMedia',
        params: { ...defaultParams, mediaFolder: 'src/static/images' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getMediaFile', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getMediaFile', params: { ...defaultParams } }),
        '"params.path" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getMediaFile',
        params: { ...defaultParams, path: 'src/static/images/image.png' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('persistMedia', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'persistMedia', params: { ...defaultParams } }),
        '"params.asset" is required',
      );
      assetFailure(
        schema.validate({
          action: 'persistMedia',
          params: { ...defaultParams, asset: { path: 'path' } },
        }),
        '"params.asset.content" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'persistMedia',
        params: {
          ...defaultParams,
          asset: { path: 'path', content: 'content', encoding: 'base64' },
          options: { commitMessage: 'commitMessage' },
        },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('deleteFile', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'deleteFile', params: { ...defaultParams } }),
        '"params.path" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'deleteFile',
        params: {
          ...defaultParams,
          path: 'src/static/images/image.png',
          options: { commitMessage: 'commitMessage' },
        },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getDeployPreview', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getDeployPreview', params: { ...defaultParams } }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'getDeployPreview',
          params: { ...defaultParams, collection: 'collection' },
        }),
        '"params.slug" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getDeployPreview',
        params: { ...defaultParams, collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });
});

describe('joi', () => {
  it('should call next on valid schema', () => {
    const next = jest.fn();

    const req = {
      body: {
        action: 'entriesByFolder',
        params: { branch: 'master', folder: 'folder', extension: 'md', depth: 1 },
      },
    } as express.Request;
    const res: express.Response = {} as express.Response;
    joi(defaultSchema())(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should send error on invalid schema', () => {
    const next = jest.fn();

    const req = {
      body: {
        action: 'entriesByFolder',
      },
    } as express.Request;
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res: express.Response = ({ status } as unknown) as express.Response;

    joi(defaultSchema())(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(status).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledTimes(1);

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({ error: '"params" is required' });
  });
});
