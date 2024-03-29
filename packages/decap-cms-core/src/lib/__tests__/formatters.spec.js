import { List, Map, fromJS } from 'immutable';

import {
  commitMessageFormatter,
  prepareSlug,
  slugFormatter,
  previewUrlFormatter,
  summaryFormatter,
  folderFormatter,
} from '../formatters';

jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.mock('../../reducers/collections');

describe('formatters', () => {
  describe('commitMessageFormatter', () => {
    const config = {
      backend: {
        name: 'git-gateway',
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return default commit message on create, label_singular', () => {
      const collection = Map({ label_singular: 'Collection' });

      expect(
        commitMessageFormatter('create', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Create Collection “doc-slug”');
    });

    it('should return default commit message on create, label', () => {
      const collection = Map({ label: 'Collections' });

      expect(
        commitMessageFormatter('update', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Update Collections “doc-slug”');
    });

    it('should return default commit message on delete', () => {
      const collection = Map({ label_singular: 'Collection' });

      expect(
        commitMessageFormatter('delete', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Delete Collection “doc-slug”');
    });

    it('should return default commit message on uploadMedia', () => {
      const collection = Map({});

      expect(
        commitMessageFormatter('uploadMedia', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Upload “file-path”');
    });

    it('should return default commit message on deleteMedia', () => {
      const collection = Map({});

      expect(
        commitMessageFormatter('deleteMedia', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Delete “file-path”');
    });

    it('should log warning on unknown variable', () => {
      const config = {
        backend: {
          commit_messages: {
            create: 'Create {{collection}} “{{slug}}” with "{{unknown variable}}"',
          },
        },
      };
      const collection = Map({ label_singular: 'Collection' });
      expect(
        commitMessageFormatter('create', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Create Collection “doc-slug” with ""');
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'Ignoring unknown variable “unknown variable” in commit message template.',
      );
    });

    it('should return custom commit message on update', () => {
      const config = {
        backend: {
          commit_messages: {
            update: 'Custom commit message',
          },
        },
      };
      const collection = Map({});
      expect(
        commitMessageFormatter('update', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Custom commit message');
    });

    it('should use empty values if "authorLogin" and "authorName" are missing in commit message', () => {
      const config = {
        backend: {
          commit_messages: {
            update: '{{author-login}} - {{author-name}}: Create {{collection}} “{{slug}}”',
          },
        },
      };
      const collection = Map({ label_singular: 'Collection' });
      expect(
        commitMessageFormatter(
          'update',
          config,
          {
            slug: 'doc-slug',
            path: 'file-path',
            collection,
          },
          true,
        ),
      ).toEqual(' - : Create Collection “doc-slug”');
    });

    it('should return custom create message with author information', () => {
      const config = {
        backend: {
          commit_messages: {
            create: '{{author-login}} - {{author-name}}: Create {{collection}} “{{slug}}”',
          },
        },
      };
      const collection = Map({ label_singular: 'Collection' });
      expect(
        commitMessageFormatter(
          'create',
          config,
          {
            slug: 'doc-slug',
            path: 'file-path',
            collection,
            authorLogin: 'user-login',
            authorName: 'Test User',
          },
          true,
        ),
      ).toEqual('user-login - Test User: Create Collection “doc-slug”');
    });

    it('should return custom open authoring message', () => {
      const config = {
        backend: {
          commit_messages: {
            openAuthoring: '{{author-login}} - {{author-name}}: {{message}}',
          },
        },
      };
      const collection = Map({ label_singular: 'Collection' });
      expect(
        commitMessageFormatter(
          'create',
          config,
          {
            slug: 'doc-slug',
            path: 'file-path',
            collection,
            authorLogin: 'user-login',
            authorName: 'Test User',
          },
          true,
        ),
      ).toEqual('user-login - Test User: Create Collection “doc-slug”');
    });

    it('should use empty values if "authorLogin" and "authorName" are missing in open authoring message', () => {
      const config = {
        backend: {
          commit_messages: {
            openAuthoring: '{{author-login}} - {{author-name}}: {{message}}',
          },
        },
      };
      const collection = Map({ label_singular: 'Collection' });
      expect(
        commitMessageFormatter(
          'create',
          config,
          {
            slug: 'doc-slug',
            path: 'file-path',
            collection,
          },
          true,
        ),
      ).toEqual(' - : Create Collection “doc-slug”');
    });

    it('should log warning on unknown variable in open authoring template', () => {
      const config = {
        backend: {
          commit_messages: {
            openAuthoring: '{{author-email}}: {{message}}',
          },
        },
      };
      const collection = Map({ label_singular: 'Collection' });
      commitMessageFormatter(
        'create',
        config,
        {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
          authorLogin: 'user-login',
          authorName: 'Test User',
        },
        true,
      );

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'Ignoring unknown variable “author-email” in open authoring message template.',
      );
    });
  });

  describe('prepareSlug', () => {
    it('should trim slug', () => {
      expect(prepareSlug(' slug ')).toBe('slug');
    });

    it('should lowercase slug', () => {
      expect(prepareSlug('Slug')).toBe('slug');
    });

    it('should remove single quotes', () => {
      expect(prepareSlug(`sl'ug`)).toBe('slug');
    });

    it('should replace periods with slashes', () => {
      expect(prepareSlug(`sl.ug`)).toBe('sl-ug');
    });
  });

  const slugConfig = {
    encoding: 'unicode',
    clean_accents: false,
    sanitize_replacement: '-',
  };

  describe('slugFormatter', () => {
    const date = new Date('2020-01-01');
    jest.spyOn(global, 'Date').mockImplementation(() => date);

    const { selectIdentifier } = require('../../reducers/collections');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should format with default pattern', () => {
      selectIdentifier.mockReturnValueOnce('title');
      expect(slugFormatter(Map(), Map({ title: 'Post Title' }), slugConfig)).toBe('post-title');
    });

    it('should format with date', () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(
        slugFormatter(
          Map({ slug: '{{year}}-{{month}}-{{day}}_{{slug}}' }),
          Map({ title: 'Post Title' }),
          slugConfig,
        ),
      ).toBe('2020-01-01_post-title');
    });

    it('should format with entry field', () => {
      selectIdentifier.mockReturnValueOnce('slug');

      expect(
        slugFormatter(
          Map({ slug: '{{fields.slug}}' }),
          Map({ title: 'Post Title', slug: 'entry-slug' }),
          slugConfig,
        ),
      ).toBe('entry-slug');
    });

    it('should return slug', () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(
        slugFormatter(Map({ slug: '{{slug}}' }), Map({ title: 'Post Title' }), slugConfig),
      ).toBe('post-title');
    });

    it('should return slug with path', () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(
        slugFormatter(
          Map({ slug: '{{year}}-{{month}}-{{day}}-{{slug}}', path: 'sub_dir/{{year}}/{{slug}}' }),
          Map({ title: 'Post Title' }),
          slugConfig,
        ),
      ).toBe('sub_dir/2020/2020-01-01-post-title');
    });

    it('should only sanitize template variables', () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(
        slugFormatter(
          Map({
            slug: '{{year}}-{{month}}-{{day}}-{{slug}}.en',
            path: 'sub_dir/{{year}}/{{slug}}',
          }),
          Map({ title: 'Post Title' }),
          slugConfig,
        ),
      ).toBe('sub_dir/2020/2020-01-01-post-title.en');
    });

    it(`should replace '.' in path with -`, () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(
        slugFormatter(
          Map({
            slug: '{{slug}}.en',
            path: '../dir/{{slug}}',
          }),
          Map({ title: 'Post Title' }),
          slugConfig,
        ),
      ).toBe('--/dir/post-title.en');
    });
  });

  describe('previewUrlFormatter', () => {
    it('should return undefined when missing baseUrl', () => {
      expect(previewUrlFormatter('')).toBeUndefined();
    });

    it('should return baseUrl for collection with no preview_path', () => {
      expect(previewUrlFormatter('https://www.example.com', Map({}))).toBe(
        'https://www.example.com',
      );
    });

    it('should return preview url based on preview_path and preview_path_date_field', () => {
      const date = new Date('2020-01-02T13:28:27.679Z');
      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            preview_path: '{{year}}/{{slug}}/{{title}}/{{fields.slug}}',
            preview_path_date_field: 'customDateField',
          }),
          'backendSlug',
          Map({ data: Map({ customDateField: date, slug: 'entrySlug', title: 'title' }) }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/2020/backendslug/title/entryslug');
    });

    it('should return preview url for files in file collection', () => {
      const file = Map({ name: 'about-file', preview_path: '{{slug}}/{{fields.slug}}/{{title}}' });

      const { getFileFromSlug } = require('../../reducers/collections');
      getFileFromSlug.mockReturnValue(file);

      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            preview_path: '{{slug}}/{{title}}/{{fields.slug}}',
            type: 'file_based_collection',
            files: List([file]),
          }),
          'backendSlug',
          Map({ data: Map({ slug: 'about-the-project', title: 'title' }), slug: 'about-file' }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/backendslug/about-the-project/title');
    });

    it('should return preview url for files in file collection when defined on file-level only', () => {
      const file = Map({ name: 'about-file', preview_path: '{{slug}}/{{fields.slug}}/{{title}}' });

      const { getFileFromSlug } = require('../../reducers/collections');
      getFileFromSlug.mockReturnValue(file);

      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            type: 'file_based_collection',
            files: List([file]),
          }),
          'backendSlug',
          Map({ data: Map({ slug: 'about-the-project', title: 'title' }), slug: 'about-file' }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/backendslug/about-the-project/title');
    });

    it('should fall back to collection preview url for files in file collection', () => {
      const file = Map({ name: 'about-file' });

      const { getFileFromSlug } = require('../../reducers/collections');
      getFileFromSlug.mockReturnValue(file);

      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            preview_path: '{{slug}}/{{title}}/{{fields.slug}}',
            type: 'file_based_collection',
            files: List([file]),
          }),
          'backendSlug',
          Map({ data: Map({ slug: 'about-the-project', title: 'title' }), slug: 'about-file' }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/backendslug/title/about-the-project');
    });

    it('should infer date field when preview_path_date_field is not configured', () => {
      const { selectInferredField } = require('../../reducers/collections');
      selectInferredField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      expect(
        previewUrlFormatter(
          'https://www.example.com',
          fromJS({
            name: 'posts',
            preview_path: '{{year}}/{{month}}/{{slug}}/{{title}}/{{fields.slug}}',
          }),
          'backendSlug',
          Map({ data: Map({ date, slug: 'entrySlug', title: 'title' }) }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/2020/01/backendslug/title/entryslug');
    });

    it('should compile filename and extension template values', () => {
      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            preview_path: 'posts/{{filename}}.{{extension}}',
          }),
          'backendSlug',
          Map({ data: Map({}), path: 'src/content/posts/title.md' }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/posts/title.md');
    });

    it('should compile the dirname template value to empty in a regular collection', () => {
      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            folder: '_portfolio',
            preview_path: 'portfolio/{{dirname}}',
          }),
          'backendSlug',
          Map({ data: Map({}), path: '_portfolio/i-am-the-slug.md' }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/portfolio/');
    });

    it('should compile dirname template value when in a nested collection', () => {
      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            folder: '_portfolio',
            preview_path: 'portfolio/{{dirname}}',
            nested: { depth: 100 },
            meta: { path: { widget: 'string', label: 'Path', index_file: 'index' } },
          }),
          'backendSlug',
          Map({ data: Map({}), path: '_portfolio/drawing/i-am-the-slug/index.md' }),
          slugConfig,
        ),
      ).toBe('https://www.example.com/portfolio/drawing/i-am-the-slug');
    });

    it('should log error and ignore preview_path when date is missing', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(
        previewUrlFormatter(
          'https://www.example.com',
          Map({
            name: 'posts',
            preview_path: '{{year}}',
            preview_path_date_field: 'date',
          }),
          'backendSlug',
          Map({ data: Map({}) }),
          slugConfig,
        ),
      ).toBe('https://www.example.com');

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Collection "posts" configuration error:\n  `preview_path_date_field` must be a field with a valid date. Ignoring `preview_path`.',
      );
    });
  });

  describe('summaryFormatter', () => {
    it('should return summary from template', () => {
      const { selectInferredField } = require('../../reducers/collections');
      selectInferredField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      const entry = fromJS({ data: { date, title: 'title' } });
      const collection = fromJS({ fields: [{ name: 'date', widget: 'date' }] });

      expect(summaryFormatter('{{title}}-{{year}}', entry, collection)).toBe('title-2020');
    });

    it('should handle filename and extension variables', () => {
      const { selectInferredField } = require('../../reducers/collections');
      selectInferredField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      const entry = fromJS({ path: 'post.md', data: { date, title: 'title' } });
      const collection = fromJS({ fields: [{ name: 'date', widget: 'date' }] });

      expect(
        summaryFormatter('{{title}}-{{year}}-{{filename}}.{{extension}}', entry, collection),
      ).toBe('title-2020-post.md');
    });

    it('should handle the dirname variable in a regular collection', () => {
      const { selectInferredField } = require('../../reducers/collections');
      selectInferredField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      const entry = fromJS({
        path: '_portfolio/drawing.md',
        data: { date, title: 'title' },
      });
      const collection = fromJS({
        folder: '_portfolio',
        fields: [{ name: 'date', widget: 'date' }],
      });

      expect(summaryFormatter('{{dirname}}/{{title}}-{{year}}', entry, collection)).toBe(
        '/title-2020',
      );
    });

    it('should handle the dirname variable in a nested collection', () => {
      const { selectInferredField } = require('../../reducers/collections');
      selectInferredField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      const entry = fromJS({
        path: '_portfolio/drawing/index.md',
        data: { date, title: 'title' },
      });
      const collection = fromJS({
        folder: '_portfolio',
        nested: { depth: 100 },
        meta: { path: { widget: 'string', label: 'Path', index_file: 'index' } },
        fields: [{ name: 'date', widget: 'date' }],
      });

      expect(summaryFormatter('{{dirname}}/{{title}}-{{year}}', entry, collection)).toBe(
        'drawing/title-2020',
      );
    });
  });

  describe('folderFormatter', () => {
    it('should return folder is entry is undefined', () => {
      expect(folderFormatter('static/images', undefined)).toBe('static/images');
    });

    it('should return folder is entry data is undefined', () => {
      expect(folderFormatter('static/images', Map({}))).toBe('static/images');
    });

    it('should return formatted folder', () => {
      const { selectIdentifier } = require('../../reducers/collections');
      selectIdentifier.mockReturnValue('title');

      const entry = fromJS({
        path: 'content/en/hosting-and-deployment/deployment-with-nanobox.md',
        data: { title: 'Deployment With NanoBox', category: 'Hosting And Deployment' },
      });
      const collection = fromJS({});

      expect(
        folderFormatter(
          '../../../{{media_folder}}/{{category}}/{{slug}}',
          entry,
          collection,
          'static/images',
          'media_folder',
          slugConfig,
        ),
      ).toBe('../../../static/images/hosting-and-deployment/deployment-with-nanobox');
    });

    it('should compile filename template value', () => {
      const entry = fromJS({
        path: 'content/en/hosting-and-deployment/deployment-with-nanobox.md',
        data: { category: 'Hosting And Deployment' },
      });
      const collection = fromJS({});

      expect(
        folderFormatter(
          '../../../{{media_folder}}/{{category}}/{{filename}}',
          entry,
          collection,
          'static/images',
          'media_folder',
          slugConfig,
        ),
      ).toBe('../../../static/images/hosting-and-deployment/deployment-with-nanobox');
    });

    it('should compile extension template value', () => {
      const entry = fromJS({
        path: 'content/en/hosting-and-deployment/deployment-with-nanobox.md',
        data: { category: 'Hosting And Deployment' },
      });
      const collection = fromJS({});

      expect(
        folderFormatter(
          '{{extension}}',
          entry,
          collection,
          'static/images',
          'media_folder',
          slugConfig,
        ),
      ).toBe('md');
    });

    it('should compile dirname template value in a regular collection', () => {
      const entry = fromJS({
        path: 'content/en/hosting-and-deployment/deployment-with-nanobox.md',
        data: { category: 'Hosting And Deployment' },
      });
      const collection = fromJS({
        folder: 'content/en/',
      });

      expect(
        folderFormatter(
          '{{dirname}}',
          entry,
          collection,
          'static/images',
          'media_folder',
          slugConfig,
        ),
      ).toBe('hosting-and-deployment');
    });

    it('should compile dirname template value in a nested collection', () => {
      const entry = fromJS({
        path: '_portfolio/drawing/i-am-the-slug/index.md',
        data: { category: 'Hosting And Deployment' },
      });
      const collection = fromJS({
        folder: '_portfolio',
        nested: { depth: 100 },
        meta: { path: { widget: 'string', label: 'Path', index_file: 'index' } },
        fields: [{ name: 'date', widget: 'date' }],
      });

      expect(
        folderFormatter(
          '{{dirname}}',
          entry,
          collection,
          'static/images',
          'media_folder',
          slugConfig,
        ),
      ).toBe('drawing/i-am-the-slug');
    });
  });
});
