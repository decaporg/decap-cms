import { Map } from 'immutable';
import { commitMessageFormatter, prepareSlug, slugFormatter } from '../backendHelper';

jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.mock('Reducers/collections');

describe('backendHelper', () => {
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

  describe('slugFormatter', () => {
    const date = new Date('2020-01-01');
    jest.spyOn(global, 'Date').mockImplementation(() => date);

    const { selectIdentifier } = require('Reducers/collections');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should format with default pattern', () => {
      selectIdentifier.mockReturnValueOnce('title');
      expect(slugFormatter(Map(), Map({ title: 'Post Title' }))).toBe('post-title');
    });

    it('should format with date', () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(
        slugFormatter(
          Map({ slug: '{{year}}-{{month}}-{{day}}_{{slug}}' }),
          Map({ title: 'Post Title' }),
        ),
      ).toBe('2020-01-01_post-title');
    });

    it('should format with entry field', () => {
      selectIdentifier.mockReturnValueOnce('slug');

      expect(
        slugFormatter(
          Map({ slug: '{{fields.slug}}' }),
          Map({ title: 'Post Title', slug: 'entry-slug' }),
        ),
      ).toBe('entry-slug');
    });

    it('should return slug', () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(slugFormatter(Map({ slug: '{{slug}}' }), Map({ title: 'Post Title' }))).toBe(
        'post-title',
      );
    });

    it('should return slug with path', () => {
      selectIdentifier.mockReturnValueOnce('title');

      expect(
        slugFormatter(
          Map({ slug: '{{year}}-{{month}}-{{day}}-{{slug}}', path: 'sub_dir/{{year}}/{{slug}}' }),
          Map({ title: 'Post Title' }),
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
        ),
      ).toBe('sub_dir/2020/2020-01-01-post-title.en');
    });
  });
});
