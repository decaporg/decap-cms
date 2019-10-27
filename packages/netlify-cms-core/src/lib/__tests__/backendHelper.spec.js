import { Map } from 'immutable';
import { commitMessageFormatter } from '../backendHelper';

jest.spyOn(console, 'warn').mockImplementation(() => {});

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
      commitMessageFormatter('create', config, { slug: 'doc-slug', path: 'file-path', collection }),
    ).toEqual('Create Collection “doc-slug”');
  });

  it('should return default commit message on create', () => {
    collection.get.mockReturnValueOnce(undefined);
    collection.get.mockReturnValueOnce('Collections');

    expect(
      commitMessageFormatter('update', config, { slug: 'doc-slug', path: 'file-path', collection }),
    ).toEqual('Update Collections “doc-slug”');
  });

  it('should return default commit message on delete', () => {
    expect(
      commitMessageFormatter('delete', config, { slug: 'doc-slug', path: 'file-path', collection }),
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
