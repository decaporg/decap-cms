import { defaultSchema } from './joi';
import Joi from '@hapi/joi';

const assetFailure = (result: Joi.ValidationResult, expectedMessage: string) => {
  const { error } = result;
  expect(error).not.toBeNull();
  expect(error.details).toHaveLength(1);
  const message = error.details.map(({ message }) => message)[0];
  expect(message).toBe(expectedMessage);
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
      '"action" must be one of [entriesByFolder, entriesByFiles, getEntry, unpublishedEntries, unpublishedEntry, deleteUnpublishedEntry, persistEntry, updateUnpublishedEntryStatus, publishUnpublishedEntry, getMedia, getMediaFile, persistMedia, deleteFile, getDeployPreview]',
    );
  });

  describe('entriesByFolder', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'entriesByFolder', params: {} }),
        '"params.folder" is required',
      );
      assetFailure(
        schema.validate({ action: 'entriesByFolder', params: { folder: 'folder' } }),
        '"params.extension" is required',
      );
      assetFailure(
        schema.validate({
          action: 'entriesByFolder',
          params: { folder: 'folder', extension: 'md' },
        }),
        '"params.depth" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'entriesByFolder',
        params: { folder: 'folder', extension: 'md', depth: 1 },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('entriesByFiles', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'entriesByFiles', params: {} }),
        '"params.files" is required',
      );
      assetFailure(
        schema.validate({ action: 'entriesByFiles', params: { files: {} } }),
        '"params.files" must be an array',
      );
      assetFailure(
        schema.validate({ action: 'entriesByFiles', params: { files: [{ id: 'id' }] } }),
        '"params.files[0].path" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'entriesByFiles',
        params: { files: [{ path: 'path' }] },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getEntry', params: {} }),
        '"params.path" is required',
      );
      assetFailure(
        schema.validate({ action: 'getEntry', params: { path: 1 } }),
        '"params.path" must be a string',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getEntry',
        params: { path: 'path' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('unpublishedEntries', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(schema.validate({ action: 'unpublishedEntries' }), '"params" is required');
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'unpublishedEntries',
        params: {},
      });

      expect(error).toBeUndefined();
    });
  });

  describe('unpublishedEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'unpublishedEntry', params: {} }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({ action: 'unpublishedEntry', params: { collection: 'collection' } }),
        '"params.slug" is required',
      );
      assetFailure(
        schema.validate({
          action: 'unpublishedEntry',
          params: { collection: 'collection', slug: 1 },
        }),
        '"params.slug" must be a string',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'unpublishedEntry',
        params: { collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('deleteUnpublishedEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'deleteUnpublishedEntry', params: {} }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({ action: 'deleteUnpublishedEntry', params: { collection: 'collection' } }),
        '"params.slug" is required',
      );
      assetFailure(
        schema.validate({
          action: 'deleteUnpublishedEntry',
          params: { collection: 'collection', slug: 1 },
        }),
        '"params.slug" must be a string',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'deleteUnpublishedEntry',
        params: { collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('persistEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'persistEntry', params: {} }),
        '"params.entry" is required',
      );
      assetFailure(
        schema.validate({
          action: 'persistEntry',
          params: { entry: { path: 'path', raw: 'content' } },
        }),
        '"params.assets" is required',
      );
      assetFailure(
        schema.validate({
          action: 'persistEntry',
          params: {
            entry: { path: 'path', raw: 'content' },
            assets: [],
          },
        }),
        '"params.options" is required',
      );
      assetFailure(
        schema.validate({
          action: 'persistEntry',
          params: {
            entry: { path: 'path', raw: 'content' },
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
          entry: { path: 'path', raw: 'content' },
          assets: [{ path: 'path', content: 'content', encoding: 'base64' }],
          options: {
            commitMessage: 'commitMessage',
            useWorkflow: true,
            unpublished: true,
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
        schema.validate({ action: 'updateUnpublishedEntryStatus', params: {} }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'updateUnpublishedEntryStatus',
          params: { collection: 'collection' },
        }),
        '"params.slug" is required',
      );
      assetFailure(
        schema.validate({
          action: 'updateUnpublishedEntryStatus',
          params: { collection: 'collection', slug: 'slug' },
        }),
        '"params.newStatus" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'updateUnpublishedEntryStatus',
        params: { collection: 'collection', slug: 'slug', newStatus: 'draft' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('publishUnpublishedEntry', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'publishUnpublishedEntry', params: {} }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'publishUnpublishedEntry',
          params: { collection: 'collection' },
        }),
        '"params.slug" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'publishUnpublishedEntry',
        params: { collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getMedia', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getMedia', params: {} }),
        '"params.mediaFolder" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getMedia',
        params: { mediaFolder: 'src/static/images' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getMediaFile', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getMediaFile', params: {} }),
        '"params.path" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getMediaFile',
        params: { path: 'src/static/images/image.png' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('persistMedia', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'persistMedia', params: {} }),
        '"params.asset" is required',
      );
      assetFailure(
        schema.validate({ action: 'persistMedia', params: { asset: { path: 'path' } } }),
        '"params.asset.content" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'persistMedia',
        params: { asset: { path: 'path', content: 'content', encoding: 'base64' } },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('deleteFile', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'deleteFile', params: {} }),
        '"params.path" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'deleteFile',
        params: { path: 'src/static/images/image.png' },
      });

      expect(error).toBeUndefined();
    });
  });

  describe('getDeployPreview', () => {
    it('should fail on invalid params', () => {
      const schema = defaultSchema();

      assetFailure(
        schema.validate({ action: 'getDeployPreview', params: {} }),
        '"params.collection" is required',
      );
      assetFailure(
        schema.validate({
          action: 'getDeployPreview',
          params: { collection: 'collection' },
        }),
        '"params.slug" is required',
      );
    });

    it('should pass on valid params', () => {
      const schema = defaultSchema();
      const { error } = schema.validate({
        action: 'getDeployPreview',
        params: { collection: 'collection', slug: 'slug' },
      });

      expect(error).toBeUndefined();
    });
  });
});
