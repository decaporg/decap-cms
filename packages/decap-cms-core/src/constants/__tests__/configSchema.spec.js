import merge from 'lodash/merge';

import { validateConfig } from '../configSchema';

jest.mock('../../lib/registry');

describe('config', () => {
  /**
   * Suppress error logging to reduce noise during testing. Jest will still
   * log test failures and associated errors as expected.
   */
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  const { getWidgets } = require('../../lib/registry');
  getWidgets.mockImplementation(() => [{}]);

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
      }).toThrowError("config must have required property 'backend'");
    });

    it('should throw if backend name is not defined in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: {} });
      }).toThrowError("'backend' must have required property 'name'");
    });

    it('should throw if backend name is not a string in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: { name: {} } });
      }).toThrowError("'backend.name' must be string");
    });

    it('should throw if backend.open_authoring is not a boolean in config', () => {
      expect(() => {
        validateConfig(merge(validConfig, { backend: { open_authoring: 'true' } }));
      }).toThrowError("'backend.open_authoring' must be boolean");
    });

    it('should not throw if backend.open_authoring is boolean in config', () => {
      expect(() => {
        validateConfig(merge(validConfig, { backend: { open_authoring: true } }));
      }).not.toThrowError();
    });

    it('should throw if backend.auth_scope is not "repo" or "public_repo" in config', () => {
      expect(() => {
        validateConfig(merge(validConfig, { backend: { auth_scope: 'user' } }));
      }).toThrowError("'backend.auth_scope' must be equal to one of the allowed values");
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
      }).toThrowError("config must have required property 'media_folder'");
    });

    it('should throw if media_folder is not a string in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: { name: 'bar' }, media_folder: {} });
      }).toThrowError("'media_folder' must be string");
    });

    it('should throw if collections is not defined in config', () => {
      expect(() => {
        validateConfig({ foo: 'bar', backend: { name: 'bar' }, media_folder: 'baz' });
      }).toThrowError("config must have required property 'collections'");
    });

    it('should throw if collections not an array in config', () => {
      expect(() => {
        validateConfig({
          foo: 'bar',
          backend: { name: 'bar' },
          media_folder: 'baz',
          collections: {},
        });
      }).toThrowError("'collections' must be array");
    });

    it('should throw if collections is an empty array in config', () => {
      expect(() => {
        validateConfig({
          foo: 'bar',
          backend: { name: 'bar' },
          media_folder: 'baz',
          collections: [],
        });
      }).toThrowError("'collections' must NOT have fewer than 1 items");
    });

    it('should throw if collections is an array with a single null element in config', () => {
      expect(() => {
        validateConfig({
          foo: 'bar',
          backend: { name: 'bar' },
          media_folder: 'baz',
          collections: [null],
        });
      }).toThrowError("'collections[0]' must be object");
    });

    it('should throw if local_backend is not a boolean or plain object', () => {
      expect(() => {
        validateConfig({ ...validConfig, local_backend: [] });
      }).toThrowError("'local_backend' must be boolean");
    });

    it('should throw if local_backend url is not a string', () => {
      expect(() => {
        validateConfig({ ...validConfig, local_backend: { url: [] } });
      }).toThrowError("'local_backend.url' must be string");
    });

    it('should throw if local_backend allowed_hosts is not a string array', () => {
      expect(() => {
        validateConfig({ ...validConfig, local_backend: { allowed_hosts: [true] } });
      }).toThrowError("'local_backend.allowed_hosts[0]' must be string");
    });

    it('should not throw if local_backend is a boolean', () => {
      expect(() => {
        validateConfig({ ...validConfig, local_backend: true });
      }).not.toThrowError();
    });

    it('should not throw if local_backend is a plain object with url string property', () => {
      expect(() => {
        validateConfig({ ...validConfig, local_backend: { url: 'http://localhost:8081/api/v1' } });
      }).not.toThrowError();
    });

    it('should not throw if local_backend is a plain object with allowed_hosts string array property', () => {
      expect(() => {
        validateConfig({
          ...validConfig,
          local_backend: { allowed_hosts: ['192.168.0.1'] },
        });
      }).not.toThrowError();
    });

    it('should throw if collection publish is not a boolean', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ publish: 'false' }] }));
      }).toThrowError("'collections[0].publish' must be boolean");
    });

    it('should not throw if collection publish is a boolean', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ publish: false }] }));
      }).not.toThrowError();
    });

    it('should throw if collections sortable_fields is not a boolean or a string array', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ sortable_fields: 'title' }] }));
      }).toThrowError("'collections[0].sortable_fields' must be array");
    });

    it('should allow sortable_fields to be a string array', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ sortable_fields: ['title'] }] }));
      }).not.toThrow();
    });

    it('should allow sortable_fields to be a an empty array', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ sortable_fields: [] }] }));
      }).not.toThrow();
    });

    it('should allow sortableFields instead of sortable_fields', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ sortableFields: [] }] }));
      }).not.toThrow();
    });

    it('should throw if both sortable_fields and sortableFields exist', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, { collections: [{ sortable_fields: [], sortableFields: [] }] }),
        );
      }).toThrowError("'collections[0]' must NOT be valid");
    });

    it('should throw if collection names are not unique', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [validConfig.collections[0], validConfig.collections[0]],
          }),
        );
      }).toThrowError("'collections' collections names must be unique");
    });

    it('should throw if collection file names are not unique', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [
              {},
              {
                files: [
                  {
                    name: 'a',
                    label: 'a',
                    file: 'a.md',
                    fields: [{ name: 'title', label: 'title', widget: 'string' }],
                  },
                  {
                    name: 'a',
                    label: 'b',
                    file: 'b.md',
                    fields: [{ name: 'title', label: 'title', widget: 'string' }],
                  },
                ],
              },
            ],
          }),
        );
      }).toThrowError("'collections[1].files' files names must be unique");
    });

    it('should throw if collection fields names are not unique', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [
              {
                fields: [
                  { name: 'title', label: 'title', widget: 'string' },
                  { name: 'title', label: 'other title', widget: 'string' },
                ],
              },
            ],
          }),
        );
      }).toThrowError("'collections[0].fields' fields names must be unique");
    });

    it('should not throw if collection fields are unique across nesting levels', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [
              {
                fields: [
                  { name: 'title', label: 'title', widget: 'string' },
                  {
                    name: 'object',
                    label: 'Object',
                    widget: 'object',
                    fields: [{ name: 'title', label: 'title', widget: 'string' }],
                  },
                ],
              },
            ],
          }),
        );
      }).not.toThrow();
    });

    describe('nested validation', () => {
      const { getWidgets } = require('../../lib/registry');
      getWidgets.mockImplementation(() => [
        {
          name: 'relation',
          schema: {
            properties: {
              search_fields: { type: 'array', items: { type: 'string' } },
              display_fields: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      ]);

      it('should throw if nested relation display_fields and search_fields are not arrays', () => {
        expect(() => {
          validateConfig(
            merge({}, validConfig, {
              collections: [
                {
                  fields: [
                    { name: 'title', label: 'title', widget: 'string' },
                    {
                      name: 'object',
                      label: 'Object',
                      widget: 'object',
                      fields: [
                        { name: 'title', label: 'title', widget: 'string' },
                        {
                          name: 'relation',
                          label: 'relation',
                          widget: 'relation',
                          display_fields: 'title',
                          search_fields: 'title',
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          );
        }).toThrowError(
          "'collections[0].fields[1].fields[1].search_fields' must be array\n'collections[0].fields[1].fields[1].display_fields' must be array",
        );
      });

      it('should not throw if nested relation display_fields and search_fields are arrays', () => {
        expect(() => {
          validateConfig(
            merge({}, validConfig, {
              collections: [
                {
                  fields: [
                    { name: 'title', label: 'title', widget: 'string' },
                    {
                      name: 'object',
                      label: 'Object',
                      widget: 'object',
                      fields: [
                        { name: 'title', label: 'title', widget: 'string' },
                        {
                          name: 'relation',
                          label: 'relation',
                          widget: 'relation',
                          display_fields: ['title'],
                          search_fields: ['title'],
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          );
        }).not.toThrow();
      });
    });

    it('should throw if collection meta is not a plain object', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ meta: [] }] }));
      }).toThrowError("'collections[0].meta' must be object");
    });

    it('should throw if collection meta is an empty object', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ meta: {} }] }));
      }).toThrowError("'collections[0].meta' must NOT have fewer than 1 properties");
    });

    it('should throw if collection meta is an empty object', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ meta: { path: {} } }] }));
      }).toThrowError("'collections[0].meta.path' must have required property 'label'");
      expect(() => {
        validateConfig(
          merge({}, validConfig, { collections: [{ meta: { path: { label: 'Label' } } }] }),
        );
      }).toThrowError("'collections[0].meta.path' must have required property 'widget'");
      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [{ meta: { path: { label: 'Label', widget: 'widget' } } }],
          }),
        );
      }).toThrowError("'collections[0].meta.path' must have required property 'index_file'");
    });

    it('should allow collection meta to have a path configuration', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [
              { meta: { path: { label: 'Path', widget: 'string', index_file: 'index' } } },
            ],
          }),
        );
      }).not.toThrow();
    });

    it('should throw if collection field pattern is not an array', () => {
      expect(() => {
        validateConfig(merge({}, validConfig, { collections: [{ fields: [{ pattern: '' }] }] }));
      }).toThrowError("'collections[0].fields[0].pattern' must be array");
    });

    it('should throw if collection field pattern is not an array of [string|regex, string]', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, { collections: [{ fields: [{ pattern: [1, ''] }] }] }),
        );
      }).toThrowError(
        "'collections[0].fields[0].pattern[0]' must be string\n'collections[0].fields[0].pattern[0]' must be a regular expression",
      );

      expect(() => {
        validateConfig(
          merge({}, validConfig, { collections: [{ fields: [{ pattern: ['', 1] }] }] }),
        );
      }).toThrowError("'collections[0].fields[0].pattern[1]' must be string");
    });

    it('should allow collection field pattern to be an array of [string|regex, string]', () => {
      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [{ fields: [{ pattern: ['pattern', 'error'] }] }],
          }),
        );
      }).not.toThrow();

      expect(() => {
        validateConfig(
          merge({}, validConfig, {
            collections: [{ fields: [{ pattern: [/pattern/, 'error'] }] }],
          }),
        );
      }).not.toThrow();
    });

    describe('i18n', () => {
      it('should throw error when locale has invalid characters', () => {
        expect(() => {
          validateConfig(
            merge({}, validConfig, {
              i18n: {
                structure: 'multiple_folders',
                locales: ['en', 'tr.TR'],
              },
            }),
          );
        }).toThrowError(`'i18n.locales[1]' must match pattern "^[a-zA-Z-_]+$"`);
      });

      it('should throw error when locale is less than 2 characters', () => {
        expect(() => {
          validateConfig(
            merge({}, validConfig, {
              i18n: {
                structure: 'multiple_folders',
                locales: ['en', 't'],
              },
            }),
          );
        }).toThrowError(`'i18n.locales[1]' must NOT have fewer than 2 characters`);
      });

      it('should throw error when locale is more than 10 characters', () => {
        expect(() => {
          validateConfig(
            merge({}, validConfig, {
              i18n: {
                structure: 'multiple_folders',
                locales: ['en', 'a_very_long_locale'],
              },
            }),
          );
        }).toThrowError(`'i18n.locales[1]' must NOT have more than 10 characters`);
      });

      it('should throw error when locales is less than 1 items', () => {
        expect(() => {
          validateConfig(
            merge({}, validConfig, {
              i18n: {
                structure: 'multiple_folders',
                locales: [],
              },
            }),
          );
        }).toThrowError(`'i18n.locales' must NOT have fewer than 1 items`);
      });

      it('should allow valid locales strings', () => {
        expect(() => {
          validateConfig(
            merge({}, validConfig, {
              i18n: {
                structure: 'multiple_folders',
                locales: ['en', 'tr-TR', 'zh_CHS'],
              },
            }),
          );
        }).not.toThrow();
      });
    });
  });
});
