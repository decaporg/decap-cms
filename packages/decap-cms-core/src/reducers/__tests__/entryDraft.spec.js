import { Map, fromJS } from 'immutable';

import * as actions from '../../actions/entries';
import reducer from '../entryDraft';

jest.mock('uuid', () => ({ v4: jest.fn(() => '1') }));

const initialState = Map({
  entry: Map(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
  key: '',
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
      });
    });
  });

  describe('selectCustomPath', () => {
    let selectCustomPath;
    let selectHasMetaPath;
    let selectFolderEntryExtension;

    beforeEach(() => {
      jest.resetModules();
      selectHasMetaPath = jest.fn(
        collection => collection.has('meta') && collection.get('meta').has('path'),
      );
      selectFolderEntryExtension = jest.fn(collection => collection.get('extension') || 'md');

      jest.doMock('../collections', () => ({
        selectHasMetaPath,
        selectFolderEntryExtension,
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
  });
});
