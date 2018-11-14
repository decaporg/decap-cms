import { validateConfig } from '../configSchema';

describe('config', () => {
  /**
   * Suppress error logging to reduce noise during testing. Jest will still
   * log test failures and associated errors as expected.
   */
  beforeEach(() => {
    jest.spyOn(console, 'error');
  });

  describe('validateConfig', () => {
    it('should not throw if no errors', () => {
      const config = {
        backend: { name: 'bar' },
        media_folder: 'baz',
        collections: [
          {
            name: 'posts',
            label: 'Posts',
            folder: '_posts',
            fields: [{ name: 'title' }],
          },
        ],
      };
      expect(() => {
        validateConfig(config);
      }).not.toThrowError();
    });

    describe('backend', () => {
      it('should throw if backend is not defined in config', () => {
        expect(() => {
          validateConfig({});
        }).toThrowError("config should have required property 'backend'");
      });

      it('should throw if backend name is not defined in config', () => {
        expect(() => {
          validateConfig({ backend: {} });
        }).toThrowError("'backend' should have required property 'name'");
      });

      it('should throw if backend name is not a string in config', () => {
        expect(() => {
          validateConfig({ backend: { name: {} } });
        }).toThrowError("'backend.name' should be string");
      });
    });

    describe('media_folder', () => {
      const config = { backend: { name: 'bar' } };
      it('should throw if media_folder is not defined in config', () => {
        expect(() => {
          validateConfig(config);
        }).toThrowError("config should have required property 'media_folder'");
      });

      it('should throw if media_folder is not a string in config', () => {
        expect(() => {
          validateConfig({ ...config, media_folder: {} });
        }).toThrowError("'media_folder' should be string");
      });
    });

    describe('collections', () => {
      const config = { backend: { name: 'bar' }, media_folder: 'baz' };
      it('should throw if collections is not defined in config', () => {
        expect(() => {
          validateConfig(config);
        }).toThrowError("config should have required property 'collections'");
      });

      it('should throw if collections not an array in config', () => {
        expect(() => {
          validateConfig({ ...config, collections: {} });
        }).toThrowError("'collections' should be array");
      });

      it('should throw if collections is an empty array in config', () => {
        expect(() => {
          validateConfig({ ...config, collections: [] });
        }).toThrowError("'collections' should NOT have less than 1 items");
      });

      it('should throw if collections is an array with a single null element in config', () => {
        expect(() => {
          validateConfig({ ...config, collections: [null] });
        }).toThrowError("'collections[0]' should be object");
      });

      it('should allow a custom identifier_field', () => {
        expect(() => {
          validateConfig({
            ...config,
            collections: [{
              name: 'foo',
              label: 'Foo',
              folder: 'bar',
              identifier_field: 'baz',
              fields: [{ name: 'baz' }],
            }],
          });
        }).not.toThrowError();
      });
    });
  });
});
