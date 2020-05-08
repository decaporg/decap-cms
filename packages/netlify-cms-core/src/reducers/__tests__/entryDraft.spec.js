import { Map, fromJS } from 'immutable';
import * as actions from 'Actions/entries';
import reducer, {entryTreeMapRootNode} from '../entryDraft';

jest.mock('uuid/v4', () => jest.fn(() => '1'));

const initialState = Map({
  entry: Map(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  entryTreeMap: entryTreeMapRootNode,
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
          entryTreeMap: entryTreeMapRootNode,
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
          entryTreeMap: entryTreeMapRootNode,
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
        entryTreeMap: entryTreeMapRootNode.toJS(),
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
        entryTreeMap: entryTreeMapRootNode.toJS(),
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
        entryTreeMap: entryTreeMapRootNode.toJS(),
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
        entryTreeMap: entryTreeMapRootNode.toJS(),
        hasChanged: false,
        localBackup: {
          entry: { ...entry, mediaFiles: [{ id: '1' }] },
        },
        key: '',
      });
    });
  });

  describe('ADD_TO_TREE_MAP', () => {
    it('should create correct tree map of fields', () => {
      const listField = Map({ name: 'list1', widget: 'list' });
      const listField2 = Map({ name: 'list2', widget: 'list' });
      const subListField = Map({ name: 'sublist1', widget: 'list' });
      const subSubListField = Map({ name: 'subsublist1', widget: 'list' });
      const stringField = Map({ name: 'string1', widget: 'string' });

      let state = reducer(initialState, actions.addToEntryTreeMap({ id: '1', field: listField }));
      state = reducer(state, actions.addToEntryTreeMap({ id: '2', field: stringField }, '1'));
      state = reducer(state, actions.addToEntryTreeMap({ id: '3', field: subListField }, '1'));
      state = reducer(state, actions.addToEntryTreeMap({ id: '4', field: subSubListField }, '3'));
      state = reducer(state, actions.addToEntryTreeMap({ id: '5', field: listField2 }));

      const entryTreeMapState = [
        {
          id: '1',
          name: listField.get('name'),
          type: listField.get('widget'),
          childNodes: [
            {
              id: '2',
              name: stringField.get('name'),
              type: stringField.get('widget'),
              childNodes: [],
            },
            {
              id: '3',
              name: subListField.get('name'),
              type: subListField.get('widget'),
              childNodes: [
                {
                  id: '4',
                  name: subSubListField.get('name'),
                  type: subSubListField.get('widget'),
                  childNodes: [],
                },
              ],
            },
          ],
        },
        {
          id: '5',
          name: listField2.get('name'),
          type: listField2.get('widget'),
          childNodes: [],
        },
      ];

      const root = entryTreeMapRootNode.toJS();
      root.childNodes = entryTreeMapState;

      expect(state.toJS()).toEqual({
        entry: {},
        fieldsMetaData: {},
        fieldsErrors: {},
        entryTreeMap: root,
        hasChanged: false,
        key: '',
      });
    });
  });
});
