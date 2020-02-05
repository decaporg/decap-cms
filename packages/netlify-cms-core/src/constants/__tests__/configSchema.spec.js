import { merge } from 'lodash';
import { validateConfig } from '../configSchema';

describe('config', () => {
  /**
   * Suppress error logging to reduce noise during testing. Jest will still
   * log test failures and associated errors as expected.
   */
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('validateConfig', () => {
    const validConfig = {
      foo: 'bar',
      backend: { name: 'bar' },
      media_folder: 'baz',
      collections: [
        {
          name: 'posts',
          label: 'Posts',
          folder: '_posts',
          fields: [{ name: 'title', label: 'title', widget: 'string' }],
        },
      ],
    };

    it('should not throw if no errors', () => {
      expect(() => {
        validateConfig(validConfig);
      }).not.toThrowError();
    });

    it('should throw if backend is not defined in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar' });
      }).toThrowError("config should have required property 'backend'");
    });

    it('should throw if backend name is not defined in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: {} });
      }).toThrowError("'backend' should have required property 'name'");
    });

    it('should throw if backend name is not a string in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: { name: {} } });
      }).toThrowError("'backend.name' should be string");
    });

    it('should throw if backend.open_authoring is not a boolean in config', () => {
      expect(() => {
        validateConfig(merge(validConfig, { backend: { open_authoring: 'true' } }));
      }).toThrowError("'backend.open_authoring' should be boolean");
    });

    it('should not throw if backend.open_authoring is boolean in config', () => {
      expect(() => {
        validateConfig(merge(validConfig, { backend: { open_authoring: true } }));
      }).not.toThrowError();
    });

    it('should throw if backend.auth_scope is not "repo" or "public_repo" in config', () => {
      expect(() => {
        validateConfig(merge(validConfig, { backend: { auth_scope: 'user' } }));
      }).toThrowError("'backend.auth_scope' should be equal to one of the allowed values");
    });

    it('should not throw if backend.auth_scope is one of "repo" or "public_repo" in config', () => {
      expect(() => {
        validateConfig(merge(validConfig, { backend: { auth_scope: 'repo' } }));
      }).not.toThrowError();
      expect(() => {
        validateConfig(merge(validConfig, { backend: { auth_scope: 'public_repo' } }));
      }).not.toThrowError();
    });

    it('should throw if media_folder is not defined in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: { name: 'bar' } });
      }).toThrowError("config should have required property 'media_folder'");
    });

    it('should throw if media_folder is not a string in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: { name: 'bar' }, media_folder: {} });
      }).toThrowError("'media_folder' should be string");
    });

    it('should throw if collections is not defined in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: { name: 'bar' }, media_folder: 'baz' });
      }).toThrowError("config should have required property 'collections'");
    });

    it('should throw if collections not an array in config', () => {
      expect(() => {
        validateConfig({
          foo: 'bar',
          backend: { name: 'bar' },
          media_folder: 'baz',
          collections: {},
        });
      }).toThrowError("'collections' should be array");
    });

    it('should throw if collections is an empty array in config', () => {
      expect(() => {
        validateConfig({
          foo: 'bar',
          backend: { name: 'bar' },
          media_folder: 'baz',
          collections: [],
        });
      }).toThrowError("'collections' should NOT have fewer than 1 items");
    });

    it('should throw if collections is an array with a single null element in config', () => {
      expect(() => {
        validateConfig({
          foo: 'bar',
          backend: { name: 'bar' },
          media_folder: 'baz',
          collections: [null],
        });
      }).toThrowError("'collections[0]' should be object");
    });

    it('should throw if local_backend is not a boolean or plain object', () => {
      expect(() => {
        validateConfig(merge(validConfig, { local_backend: [] }));
      }).toThrowError("'local_backend' should be boolean");
    });

    it('should throw if local_backend is a plain object but missing url property', () => {
      expect(() => {
        validateConfig(merge(validConfig, { local_backend: {} }));
      }).toThrowError("'local_backend' should be object");
    });

    it('should not throw if local_backend is a boolean', () => {
      expect(() => {
        validateConfig(merge(validConfig, { local_backend: true }));
      }).not.toThrowError();
    });

    it('should not throw if local_backend is a plain object with url property', () => {
      expect(() => {
        validateConfig(
          merge(validConfig, { local_backend: { url: 'http://localhost:8081/api/v1' } }),
        );
      }).not.toThrowError();
    });
  });
});
