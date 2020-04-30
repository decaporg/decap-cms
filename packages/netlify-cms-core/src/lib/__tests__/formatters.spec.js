import { Map, fromJS } from 'immutable';
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
      getIn: jest.fn(),
    };

    const collection = {
      get: jest.fn().mockReturnValue('Collection'),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return default commit message on create', () => {
      expect(
        commitMessageFormatter('create', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Create Collection “doc-slug”');
    });

    it('should return default commit message on create', () => {
      collection.get.mockReturnValueOnce(undefined);
      collection.get.mockReturnValueOnce('Collections');

      expect(
        commitMessageFormatter('update', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Update Collections “doc-slug”');
    });

    it('should return default commit message on delete', () => {
      expect(
        commitMessageFormatter('delete', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Delete Collection “doc-slug”');
    });

    it('should return default commit message on uploadMedia', () => {
      expect(
        commitMessageFormatter('uploadMedia', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Upload “file-path”');
    });

    it('should return default commit message on deleteMedia', () => {
      expect(
        commitMessageFormatter('deleteMedia', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Delete “file-path”');
    });

    it('should log warning on unknown variable', () => {
      config.getIn.mockReturnValueOnce(
        Map({
          create: 'Create {{collection}} “{{slug}}” with "{{unknown variable}}"',
        }),
      );
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
      config.getIn.mockReturnValueOnce(
        Map({
          update: 'Custom commit message',
        }),
      );

      expect(
        commitMessageFormatter('update', config, {
          slug: 'doc-slug',
          path: 'file-path',
          collection,
        }),
      ).toEqual('Custom commit message');
    });

    it('should return custom open authoring message', () => {
      config.getIn.mockReturnValueOnce(
        Map({
          openAuthoring: '{{author-login}} - {{author-name}}: {{message}}',
        }),
      );

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
      config.getIn.mockReturnValueOnce(
        Map({
          openAuthoring: '{{author-login}} - {{author-name}}: {{message}}',
        }),
      );

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
      config.getIn.mockReturnValueOnce(
        Map({
          openAuthoring: '{{author-email}}: {{message}}',
        }),
      );

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

  const slugConfig = Map({
    encoding: 'unicode',
    clean_accents: false,
    sanitize_replacement: '-',
  });

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
          slugConfig,
          Map({ data: Map({ customDateField: date, slug: 'entrySlug', title: 'title' }) }),
        ),
      ).toBe('https://www.example.com/2020/backendslug/title/entryslug');
    });

    it('should infer date field when preview_path_date_field is not configured', () => {
      const { selectInferedField } = require('../../reducers/collections');
      selectInferedField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      expect(
        previewUrlFormatter(
          'https://www.example.com',
          fromJS({
            name: 'posts',
            preview_path: '{{year}}/{{month}}/{{slug}}/{{title}}/{{fields.slug}}',
          }),
          'backendSlug',
          slugConfig,
          Map({ data: Map({ date, slug: 'entrySlug', title: 'title' }) }),
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
          slugConfig,
          Map({ data: Map({}), path: 'src/content/posts/title.md' }),
        ),
      ).toBe('https://www.example.com/posts/title.md');
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
          slugConfig,
          Map({ data: Map({}) }),
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
      const { selectInferedField } = require('../../reducers/collections');
      selectInferedField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      const entry = fromJS({ data: { date, title: 'title' } });
      const collection = fromJS({ fields: [{ name: 'date', widget: 'date' }] });

      expect(summaryFormatter('{{title}}-{{year}}', entry, collection)).toBe('title-2020');
    });

    it('should handle filename and extension variables', () => {
      const { selectInferedField } = require('../../reducers/collections');
      selectInferedField.mockReturnValue('date');

      const date = new Date('2020-01-02T13:28:27.679Z');
      const entry = fromJS({ path: 'post.md', data: { date, title: 'title' } });
      const collection = fromJS({ fields: [{ name: 'date', widget: 'date' }] });

      expect(
        summaryFormatter('{{title}}-{{year}}-{{filename}}.{{extension}}', entry, collection),
      ).toBe('title-2020-post.md');
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
  });
});
