import { fromJS } from 'immutable';
import { stripIndent } from 'common-tags';
import {
  parseConfig,
  normalizeConfig,
  applyDefaults,
  detectProxyServer,
  handleLocalBackend,
} from '../config';

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.mock('coreSrc/backend', () => {
  return {
    resolveBackend: jest.fn(() => ({ isGitBackend: jest.fn(() => true) })),
  };
});

describe('config', () => {
  describe('parseConfig', () => {
    it('can parse simple yaml config', () => {
      const file = stripIndent`
        backend:
          name: test-repo
        media_folder: static/images
      `;

      expect(parseConfig(file)).toEqual({
        backend: { name: 'test-repo' },
        media_folder: 'static/images',
      });
    });

    it('should merge yaml aliases', () => {
      const file = stripIndent`
      backend:
        name: github
        repo: netlify/netlify-cms
        squash_merges: true
        open_authoring: true
      local_backend: true
      site_url: https://www.netlifycms.org
      publish_mode: editorial_workflow
      media_folder: website/static/img
      public_folder: img
      docs_collection: &docs_collection
        folder: website/content/docs
        create: true
        preview_path: 'docs/{{slug}}'
        fields:
          - { label: Title, name: title }
          - { label: Body, name: body, widget: markdown }
      collections:
        - <<: *docs_collection
          name: docs_start
          label: 'Docs: Quick Start'
      `;

      expect(parseConfig(file)).toEqual({
        backend: {
          name: 'github',
          repo: 'netlify/netlify-cms',
          squash_merges: true,
          open_authoring: true,
        },
        local_backend: true,
        site_url: 'https://www.netlifycms.org',
        publish_mode: 'editorial_workflow',
        media_folder: 'website/static/img',
        public_folder: 'img',
        docs_collection: {
          folder: 'website/content/docs',
          create: true,
          preview_path: 'docs/{{slug}}',
          fields: [
            { label: 'Title', name: 'title' },
            { label: 'Body', name: 'body', widget: 'markdown' },
          ],
        },
        collections: [
          {
            folder: 'website/content/docs',
            create: true,
            preview_path: 'docs/{{slug}}',
            fields: [
              { label: 'Title', name: 'title' },
              { label: 'Body', name: 'body', widget: 'markdown' },
            ],
            name: 'docs_start',
            label: 'Docs: Quick Start',
          },
        ],
      });
    });
  });
  describe('applyDefaults', () => {
    describe('publish_mode', () => {
      it('should set publish_mode if not set', () => {
        const config = fromJS({
          foo: 'bar',
          media_folder: 'path/to/media',
          public_folder: '/path/to/media',
          collections: [],
        });
        expect(applyDefaults(config).get('publish_mode')).toEqual('simple');
      });

      it('should set publish_mode from config', () => {
        const config = fromJS({
          foo: 'bar',
          publish_mode: 'complex',
          media_folder: 'path/to/media',
          public_folder: '/path/to/media',
          collections: [],
        });
        expect(applyDefaults(config).get('publish_mode')).toEqual('complex');
      });
    });

    describe('public_folder', () => {
      it('should set public_folder based on media_folder if not set', () => {
        expect(
          applyDefaults(
            fromJS({
              foo: 'bar',
              media_folder: 'path/to/media',
              collections: [],
            }),
          ).get('public_folder'),
        ).toEqual('/path/to/media');
      });

      it('should not overwrite public_folder if set', () => {
        expect(
          applyDefaults(
            fromJS({
              foo: 'bar',
              media_folder: 'path/to/media',
              public_folder: '/publib/path',
              collections: [],
            }),
          ).get('public_folder'),
        ).toEqual('/publib/path');
        expect(
          applyDefaults(
            fromJS({
              foo: 'bar',
              media_folder: 'path/to/media',
              public_folder: '',
              collections: [],
            }),
          ).get('public_folder'),
        ).toEqual('');
      });
    });

    describe('slug', () => {
      it('should set default slug config if not set', () => {
        expect(applyDefaults(fromJS({ collections: [] })).get('slug')).toEqual(
          fromJS({ encoding: 'unicode', clean_accents: false, sanitize_replacement: '-' }),
        );
      });

      it('should not overwrite slug encoding if set', () => {
        expect(
          applyDefaults(fromJS({ collections: [], slug: { encoding: 'ascii' } })).getIn([
            'slug',
            'encoding',
          ]),
        ).toEqual('ascii');
      });

      it('should not overwrite slug clean_accents if set', () => {
        expect(
          applyDefaults(fromJS({ collections: [], slug: { clean_accents: true } })).getIn([
            'slug',
            'clean_accents',
          ]),
        ).toEqual(true);
      });

      it('should not overwrite slug sanitize_replacement if set', () => {
        expect(
          applyDefaults(fromJS({ collections: [], slug: { sanitize_replacement: '_' } })).getIn([
            'slug',
            'sanitize_replacement',
          ]),
        ).toEqual('_');
      });
    });

    describe('collections', () => {
      it('should strip leading slashes from collection folder', () => {
        expect(
          applyDefaults(
            fromJS({
              collections: [{ folder: '/foo', fields: [{ name: 'title', widget: 'string' }] }],
            }),
          ).getIn(['collections', 0, 'folder']),
        ).toEqual('foo');
      });

      it('should strip leading slashes from collection files', () => {
        expect(
          applyDefaults(
            fromJS({
              collections: [
                { files: [{ file: '/foo', fields: [{ name: 'title', widget: 'string' }] }] },
              ],
            }),
          ).getIn(['collections', 0, 'files', 0, 'file']),
        ).toEqual('foo');
      });

      describe('public_folder and media_folder', () => {
        it('should set collection public_folder based on media_folder if not set', () => {
          expect(
            applyDefaults(
              fromJS({
                collections: [
                  {
                    folder: 'foo',
                    media_folder: 'static/images/docs',
                    fields: [{ name: 'title', widget: 'string' }],
                  },
                ],
              }),
            ).getIn(['collections', 0, 'public_folder']),
          ).toEqual('static/images/docs');
        });

        it('should not overwrite collection public_folder if set', () => {
          expect(
            applyDefaults(
              fromJS({
                collections: [
                  {
                    folder: 'foo',
                    media_folder: 'static/images/docs',
                    public_folder: 'images/docs',
                    fields: [{ name: 'title', widget: 'string' }],
                  },
                ],
              }),
            ).getIn(['collections', 0, 'public_folder']),
          ).toEqual('images/docs');
        });

        it("should set collection media_folder and public_folder to an empty string when collection path exists, but collection media_folder doesn't", () => {
          const result = applyDefaults(
            fromJS({
              collections: [
                {
                  folder: 'foo',
                  path: '{{slug}}/index',
                  fields: [{ name: 'title', widget: 'string' }],
                },
              ],
            }),
          );
          expect(result.getIn(['collections', 0, 'media_folder'])).toEqual('');
          expect(result.getIn(['collections', 0, 'public_folder'])).toEqual('');
        });

        it('should set file public_folder based on media_folder if not set', () => {
          expect(
            applyDefaults(
              fromJS({
                collections: [
                  {
                    files: [
                      {
                        file: 'foo',
                        media_folder: 'static/images/docs',
                        fields: [{ name: 'title', widget: 'string' }],
                      },
                    ],
                  },
                ],
              }),
            ).getIn(['collections', 0, 'files', 0, 'public_folder']),
          ).toEqual('static/images/docs');
        });

        it('should not overwrite file public_folder if set', () => {
          expect(
            applyDefaults(
              fromJS({
                collections: [
                  {
                    files: [
                      {
                        file: 'foo',
                        media_folder: 'static/images/docs',
                        public_folder: 'images/docs',
                        fields: [{ name: 'title', widget: 'string' }],
                      },
                    ],
                  },
                ],
              }),
            ).getIn(['collections', 0, 'files', 0, 'public_folder']),
          ).toEqual('images/docs');
        });

        it('should set nested field public_folder based on media_folder if not set', () => {
          const config = applyDefaults(
            fromJS({
              collections: [
                {
                  folder: 'foo',
                  path: '{{slug}}/index',
                  fields: [
                    {
                      name: 'title',
                      widget: 'string',
                      media_folder: 'collection/static/images/docs',
                    },
                  ],
                },
                {
                  files: [
                    {
                      file: 'foo',
                      fields: [
                        {
                          name: 'title',
                          widget: 'string',
                          media_folder: 'file/static/images/docs',
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          );
          expect(config.getIn(['collections', 0, 'fields', 0, 'public_folder'])).toEqual(
            'collection/static/images/docs',
          );
          expect(
            config.getIn(['collections', 1, 'files', 0, 'fields', 0, 'public_folder']),
          ).toEqual('file/static/images/docs');
        });

        it('should not overwrite nested field public_folder if set', () => {
          const config = applyDefaults(
            fromJS({
              collections: [
                {
                  folder: 'foo',
                  path: '{{slug}}/index',
                  fields: [
                    {
                      name: 'title',
                      widget: 'string',
                      media_folder: 'collection/static/images/docs',
                      public_folder: 'collection/public_folder',
                    },
                  ],
                },
                {
                  files: [
                    {
                      file: 'foo',
                      fields: [
                        {
                          name: 'title',
                          widget: 'string',
                          public_folder: 'file/public_folder',
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          );
          expect(config.getIn(['collections', 0, 'fields', 0, 'public_folder'])).toEqual(
            'collection/public_folder',
          );
          expect(
            config.getIn(['collections', 1, 'files', 0, 'fields', 0, 'public_folder']),
          ).toEqual('file/public_folder');
        });
      });

      describe('publish', () => {
        it('should set publish to true if not set', () => {
          expect(
            applyDefaults(
              fromJS({
                collections: [
                  {
                    folder: 'foo',
                    media_folder: 'static/images/docs',
                    fields: [{ name: 'title', widget: 'string' }],
                  },
                ],
              }),
            ).getIn(['collections', 0, 'publish']),
          ).toEqual(true);
        });

        it('should not override existing publish config', () => {
          expect(
            applyDefaults(
              fromJS({
                collections: [
                  {
                    folder: 'foo',
                    media_folder: 'static/images/docs',
                    publish: false,
                    fields: [{ name: 'title', widget: 'string' }],
                  },
                ],
              }),
            ).getIn(['collections', 0, 'publish']),
          ).toEqual(false);
        });
      });
    });

    test('should convert camel case to snake case', () => {
      expect(
        applyDefaults(
          normalizeConfig(
            fromJS({
              collections: [
                {
                  sortableFields: ['title'],
                  folder: 'src',
                  identifier_field: 'datetime',
                  fields: [
                    {
                      name: 'datetime',
                      widget: 'datetime',
                      dateFormat: 'YYYY/MM/DD',
                      timeFormat: 'HH:mm',
                      pickerUtc: true,
                    },
                    {
                      widget: 'number',
                      valueType: 'float',
                    },
                  ],
                },
                {
                  sortableFields: [],
                  files: [
                    {
                      name: 'file',
                      file: 'src/file.json',
                      fields: [
                        {
                          widget: 'markdown',
                          editorComponents: ['code'],
                        },
                        {
                          widget: 'relation',
                          valueField: 'title',
                          searchFields: ['title'],
                          displayFields: ['title'],
                          optionsLength: 5,
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).toJS(),
      ).toEqual({
        public_folder: '/',
        publish_mode: 'simple',
        slug: { clean_accents: false, encoding: 'unicode', sanitize_replacement: '-' },
        collections: [
          {
            sortable_fields: ['title'],
            folder: 'src',
            identifier_field: 'datetime',
            fields: [
              {
                name: 'datetime',
                widget: 'datetime',
                date_format: 'YYYY/MM/DD',
                dateFormat: 'YYYY/MM/DD',
                time_format: 'HH:mm',
                timeFormat: 'HH:mm',
                picker_utc: true,
                pickerUtc: true,
              },
              {
                widget: 'number',
                value_type: 'float',
                valueType: 'float',
              },
            ],
            meta: {},
            publish: true,
            view_filters: [],
          },
          {
            sortable_fields: [],
            files: [
              {
                name: 'file',
                file: 'src/file.json',
                fields: [
                  {
                    widget: 'markdown',
                    editor_components: ['code'],
                    editorComponents: ['code'],
                  },
                  {
                    widget: 'relation',
                    value_field: 'title',
                    valueField: 'title',
                    search_fields: ['title'],
                    searchFields: ['title'],
                    display_fields: ['title'],
                    displayFields: ['title'],
                    options_length: 5,
                    optionsLength: 5,
                  },
                ],
              },
            ],
            publish: true,
            view_filters: [],
          },
        ],
      });
    });
  });

  describe('detectProxyServer', () => {
    const assetFetchCalled = (url = 'http://localhost:8081/api/v1') => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'info' }),
      });
    };

    beforeEach(() => {
      delete window.location;
    });

    it('should return empty object when not on localhost', async () => {
      window.location = { hostname: 'www.netlify.com' };
      global.fetch = jest.fn();
      await expect(detectProxyServer()).resolves.toEqual({});

      expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('should return empty object when fetch returns an error', async () => {
      window.location = { hostname: 'localhost' };
      global.fetch = jest.fn().mockRejectedValue(new Error());
      await expect(detectProxyServer(true)).resolves.toEqual({});

      assetFetchCalled();
    });

    it('should return empty object when fetch returns an invalid response', async () => {
      window.location = { hostname: 'localhost' };
      global.fetch = jest
        .fn()
        .mockResolvedValue({ json: jest.fn().mockResolvedValue({ repo: [] }) });
      await expect(detectProxyServer(true)).resolves.toEqual({});

      assetFetchCalled();
    });

    it('should return result object when fetch returns a valid response', async () => {
      window.location = { hostname: 'localhost' };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          repo: 'test-repo',
          publish_modes: ['simple', 'editorial_workflow'],
          type: 'local_git',
        }),
      });
      await expect(detectProxyServer(true)).resolves.toEqual({
        proxyUrl: 'http://localhost:8081/api/v1',
        publish_modes: ['simple', 'editorial_workflow'],
        type: 'local_git',
      });

      assetFetchCalled();
    });

    it('should use local_backend url', async () => {
      const url = 'http://localhost:8082/api/v1';
      window.location = { hostname: 'localhost' };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          repo: 'test-repo',
          publish_modes: ['simple', 'editorial_workflow'],
          type: 'local_git',
        }),
      });
      await expect(detectProxyServer({ url })).resolves.toEqual({
        proxyUrl: url,
        publish_modes: ['simple', 'editorial_workflow'],
        type: 'local_git',
      });

      assetFetchCalled(url);
    });

    it('should use local_backend allowed_hosts', async () => {
      const allowed_hosts = ['192.168.0.1'];
      window.location = { hostname: '192.168.0.1' };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          repo: 'test-repo',
          publish_modes: ['simple', 'editorial_workflow'],
          type: 'local_git',
        }),
      });
      await expect(detectProxyServer({ allowed_hosts })).resolves.toEqual({
        proxyUrl: 'http://192.168.0.1:8081/api/v1',
        publish_modes: ['simple', 'editorial_workflow'],
        type: 'local_git',
      });

      assetFetchCalled('http://192.168.0.1:8081/api/v1');
    });
  });

  describe('handleLocalBackend', () => {
    beforeEach(() => {
      delete window.location;
    });

    it('should not replace backend config when proxy is not detected', async () => {
      window.location = { hostname: 'localhost' };
      global.fetch = jest.fn().mockRejectedValue(new Error());

      const config = fromJS({ local_backend: true, backend: { name: 'github' } });
      const actual = await handleLocalBackend(config);

      expect(actual).toEqual(config);
    });

    it('should replace backend config when proxy is detected', async () => {
      window.location = { hostname: 'localhost' };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          repo: 'test-repo',
          publish_modes: ['simple', 'editorial_workflow'],
          type: 'local_git',
        }),
      });

      const config = fromJS({ local_backend: true, backend: { name: 'github' } });
      const actual = await handleLocalBackend(config);

      expect(actual).toEqual(
        fromJS({
          local_backend: true,
          backend: { name: 'proxy', proxy_url: 'http://localhost:8081/api/v1' },
        }),
      );
    });

    it('should replace publish mode when not supported by proxy', async () => {
      window.location = { hostname: 'localhost' };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          repo: 'test-repo',
          publish_modes: ['simple'],
          type: 'local_fs',
        }),
      });

      const config = fromJS({
        local_backend: true,
        publish_mode: 'editorial_workflow',
        backend: { name: 'github' },
      });
      const actual = await handleLocalBackend(config);

      expect(actual).toEqual(
        fromJS({
          local_backend: true,
          publish_mode: 'simple',
          backend: { name: 'proxy', proxy_url: 'http://localhost:8081/api/v1' },
        }),
      );
    });
  });
});
