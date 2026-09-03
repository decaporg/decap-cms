import { Map, fromJS, List } from 'immutable';

import * as actions from '../../actions/entries';
import reducer, { selectCustomPath } from '../entryDraft';
import { FOLDER } from '../../constants/collectionTypes';

global.crypto.randomUUID = jest.fn(() => '1');

const initialState = Map({
  entry: Map(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
  key: '',
  notes: List([]),
});

const entry = {
  collection: 'posts',
  slug: 'slug',
  path: 'content/blog/art-and-wine-festival.md',
  partial: false,
  raw: '',
  data: {},
  metaData: null,
};

describe('entryDraft reducer', () => {
  describe('DRAFT_CREATE_FROM_ENTRY', () => {
    it('should create draft from the entry', () => {
      const state = reducer(initialState, actions.createDraftFromEntry(fromJS(entry)));
      expect(state).toEqual(
        fromJS({
          entry: {
            ...entry,
            newRecord: false,
          },
          fieldsMetaData: Map(),
          fieldsErrors: Map(),
          hasChanged: false,
          key: '1',
          notes: List([]),
        }),
      );
    });
  });

  describe('DRAFT_CREATE_EMPTY', () => {
    it('should create a new draft ', () => {
      const state = reducer(initialState, actions.emptyDraftCreated(fromJS(entry)));
      expect(state).toEqual(
        fromJS({
          entry: {
            ...entry,
            newRecord: true,
          },
          fieldsMetaData: Map(),
          fieldsErrors: Map(),
          hasChanged: false,
          key: '1',
          notes: List([]),
        }),
      );
    });
  });

  describe('DRAFT_DISCARD', () => {
    it('should discard the draft and return initial state', () => {
      expect(reducer(initialState, actions.discardDraft())).toEqual(initialState);
    });
  });

  describe('persisting', () => {
    let initialState;

    beforeEach(() => {
      initialState = fromJS({
        entities: {
          'posts.slug': {
            collection: 'posts',
            slug: 'slug',
            path: 'content/blog/art-and-wine-festival.md',
            partial: false,
            raw: '',
            data: {},
            metaData: null,
          },
        },
        pages: {},
      });
    });

    it('should handle persisting request', () => {
      const newState = reducer(
        initialState,
        actions.entryPersisting(Map({ name: 'posts' }), Map({ slug: 'slug' })),
      );
      expect(newState.getIn(['entry', 'isPersisting'])).toBe(true);
    });

    it('should handle persisting success', () => {
      let newState = reducer(
        initialState,
        actions.entryPersisting(Map({ name: 'posts' }), Map({ slug: 'slug' })),
      );
      newState = reducer(
        newState,
        actions.entryPersisted(Map({ name: 'posts' }), Map({ slug: 'slug' })),
      );
      expect(newState.getIn(['entry', 'isPersisting'])).toBeUndefined();
    });

    it('should handle persisting error', () => {
      let newState = reducer(
        initialState,
        actions.entryPersisting(Map({ name: 'posts' }), Map({ slug: 'slug' })),
      );
      newState = reducer(
        newState,
        actions.entryPersistFail(Map({ name: 'posts' }), Map({ slug: 'slug' }), 'Error message'),
      );
      expect(newState.getIn(['entry', 'isPersisting'])).toBeUndefined();
    });
  });

  describe('REMOVE_DRAFT_ENTRY_MEDIA_FILE', () => {
    it('should remove a media file', () => {
      const actualState = reducer(
        initialState.setIn(['entry', 'mediaFiles'], fromJS([{ id: '1' }, { id: '2' }])),
        actions.removeDraftEntryMediaFile({ id: '1' }),
      );

      expect(actualState.toJS()).toEqual({
        entry: { mediaFiles: [{ id: '2' }] },
        fieldsMetaData: {},
        fieldsErrors: {},
        hasChanged: true,
        key: '',
        notes: [], // This stays as regular array in .toJS() output
      });
    });
  });

  describe('ADD_DRAFT_ENTRY_MEDIA_FILE', () => {
    it('should overwrite an existing media file', () => {
      const actualState = reducer(
        initialState.setIn(['entry', 'mediaFiles'], fromJS([{ id: '1', name: 'old' }])),
        actions.addDraftEntryMediaFile({ id: '1', name: 'new' }),
      );

      expect(actualState.toJS()).toEqual({
        entry: { mediaFiles: [{ id: '1', name: 'new' }] },
        fieldsMetaData: {},
        fieldsErrors: {},
        hasChanged: true,
        key: '',
        notes: [], // This stays as regular array in .toJS() output
      });
    });
  });

  describe('DRAFT_CREATE_FROM_LOCAL_BACKUP', () => {
    it('should create draft from local backup', () => {
      const localBackup = Map({ entry: fromJS({ ...entry, mediaFiles: [{ id: '1' }] }) });

      const actualState = reducer(initialState.set('localBackup', localBackup), {
        type: actions.DRAFT_CREATE_FROM_LOCAL_BACKUP,
      });
      expect(actualState.toJS()).toEqual({
        entry: {
          ...entry,
          mediaFiles: [{ id: '1' }],
          newRecord: false,
        },
        fieldsMetaData: {},
        fieldsErrors: {},
        hasChanged: true,
        key: '1',
        notes: [], // This stays as regular array in .toJS() output
      });
    });
  });

  describe('DRAFT_LOCAL_BACKUP_RETRIEVED', () => {
    it('should set local backup', () => {
      const mediaFiles = [{ id: '1' }];

      const actualState = reducer(
        initialState,
        actions.localBackupRetrieved({ ...entry, mediaFiles }),
      );

      expect(actualState.toJS()).toEqual({
        entry: {},
        fieldsMetaData: {},
        fieldsErrors: {},
        hasChanged: false,
        localBackup: {
          entry: { ...entry, mediaFiles: [{ id: '1' }] },
        },
        key: '',
        notes: [], // This stays as regular array in .toJS() output
      });
    });
  });

  describe('selectCustomPath', () => {
    let selectCustomPath;
    let selectHasMetaPath;
    let selectFolderEntryExtension;
    let isNestedSubfolders;

    beforeEach(() => {
      jest.resetModules();
      selectHasMetaPath = jest.fn(
        collection => collection.has('meta') && collection.get('meta').has('path'),
      );
      selectFolderEntryExtension = jest.fn(collection => collection.get('extension') || 'md');
      isNestedSubfolders = jest.fn(() => false);

      jest.doMock('../collections', () => ({
        selectHasMetaPath,
        selectFolderEntryExtension,
        isNestedSubfolders,
      }));

      const entryDraftModule = require('../entryDraft');
      selectCustomPath = entryDraftModule.selectCustomPath;
    });

    afterEach(() => {
      jest.unmock('../collections');
    });

    it('should generate dynamic filename for new entries without index_file', () => {
      const collection = fromJS({
        folder: '_pages',
        extension: 'md',
        meta: { path: { label: 'Path', widget: 'string' } },
      });
      const entryDraft = fromJS({
        entry: {
          newRecord: true,
          data: { title: 'My Great Article' },
          meta: { path: 'blog' },
        },
      });

      const result = selectCustomPath(collection, entryDraft);
      expect(result).toBe('_pages/blog/my-great-article.md');
    });

    it('should preserve filename for existing entries without index_file', () => {
      const collection = fromJS({
        folder: '_pages',
        extension: 'md',
        meta: { path: { label: 'Path', widget: 'string' } },
      });
      const entryDraft = fromJS({
        entry: {
          newRecord: false,
          path: '_pages/old-folder/existing-file.md',
          data: { title: 'Updated Title' },
          meta: { path: 'new-folder' },
        },
      });

      const result = selectCustomPath(collection, entryDraft);
      expect(result).toBe('_pages/new-folder/existing-file.md');
    });

    it('should use index_file when specified (backward compatibility)', () => {
      const collection = fromJS({
        folder: '_pages',
        extension: 'md',
        meta: { path: { label: 'Path', widget: 'string', index_file: 'index' } },
      });
      const entryDraft = fromJS({
        entry: {
          newRecord: true,
          data: { title: 'My Article' },
          meta: { path: 'blog' },
        },
      });

      const result = selectCustomPath(collection, entryDraft);
      expect(result).toBe('_pages/blog/index.md');
    });

    it('should return undefined when path is not set', () => {
      const collection = fromJS({
        folder: '_pages',
        extension: 'md',
        meta: { path: { label: 'Path', widget: 'string' } },
      });
      const entryDraft = fromJS({
        entry: {
          newRecord: true,
          data: { title: 'My Article' },
          meta: {},
        },
      });

      const result = selectCustomPath(collection, entryDraft);
      expect(result).toBeUndefined();
    });

    it('should preserve non-latin characters in generated filename', () => {
      const collection = fromJS({
        folder: '_pages',
        extension: 'md',
        meta: { path: { label: 'Path', widget: 'string' } },
      });
      const entryDraft = fromJS({
        entry: {
          newRecord: true,
          data: { title: '日本語のタイトル' },
          meta: { path: 'blog' },
        },
      });

      const result = selectCustomPath(collection, entryDraft);
      expect(result).toBe('_pages/blog/日本語のタイトル.md');
    });
  });
});

describe('selectCustomPath', () => {
  function makeCollection(overrides = {}) {
    return fromJS({
      name: 'pages',
      type: FOLDER,
      folder: 'content/pages',
      fields: [{ name: 'title', widget: 'string' }],
      meta: {
        path: {
          widget: 'string',
          label: 'Path',
          index_file: 'index',
        },
      },
      nested: { depth: 100, summary: '{{title}}' },
      ...overrides,
    });
  }

  function makeEntryDraft(meta = {}) {
    return fromJS({
      entry: {
        meta: {
          path: 'about/team',
          ...meta,
        },
      },
    });
  }

  it('should return undefined when collection has no meta.path', () => {
    const collection = fromJS({
      name: 'posts',
      type: FOLDER,
      folder: 'content/posts',
      fields: [{ name: 'title' }],
    });
    const draft = makeEntryDraft();
    expect(selectCustomPath(collection, draft)).toBeUndefined();
  });

  it('should use index file name for nested subfolders collection', () => {
    const collection = makeCollection();
    const draft = makeEntryDraft({ path: 'about/team' });
    const result = selectCustomPath(collection, draft);
    expect(result).toBe('content/pages/about/team/index.md');
  });

  it('should default path_type to "slug"', () => {
    const collection = makeCollection({
      nested: undefined, // Remove nested so isNestedSubfolders returns false
    });
    const draft = makeEntryDraft({
      path: 'about/team',
      // path_type is NOT set, should default to 'slug'
    });
    const result = selectCustomPath(collection, draft);
    // With path_type defaulting to 'slug' and not nested, fileName = 'team', filePath = 'about'
    expect(result).toBe('content/pages/about/team.md');
  });

  it('should use index file name when path_type is explicitly "index"', () => {
    const collection = makeCollection({
      nested: undefined,
    });
    const draft = makeEntryDraft({
      path: 'about/team',
      path_type: 'index',
    });
    const result = selectCustomPath(collection, draft);
    expect(result).toBe('content/pages/about/team/index.md');
  });

  it('should use slug path when path_type is explicitly "slug"', () => {
    const collection = makeCollection({
      nested: undefined,
    });
    const draft = makeEntryDraft({
      path: 'about/team',
      path_type: 'slug',
    });
    const result = selectCustomPath(collection, draft);
    expect(result).toBe('content/pages/about/team.md');
  });

  it('should return undefined when meta.path is empty', () => {
    const collection = makeCollection();
    const draft = makeEntryDraft({ path: '' });
    expect(selectCustomPath(collection, draft)).toBeFalsy();
  });
});
