import { Map, List, fromJS } from 'immutable';
import * as actions from 'Actions/entries';
import reducer from '../entryDraft';

let initialState = Map({
  entry: Map(),
  mediaFiles: List(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
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
      expect(reducer(initialState, actions.createDraftFromEntry(fromJS(entry)))).toEqual(
        fromJS({
          entry: {
            ...entry,
            newRecord: false,
          },
          mediaFiles: [],
          fieldsMetaData: Map(),
          fieldsErrors: Map(),
          hasChanged: false,
        }),
      );
    });
  });

  describe('DRAFT_CREATE_EMPTY', () => {
    it('should create a new draft ', () => {
      expect(reducer(initialState, actions.emptyDraftCreated(fromJS(entry)))).toEqual(
        fromJS({
          entry: {
            ...entry,
            newRecord: true,
          },
          mediaFiles: [],
          fieldsMetaData: Map(),
          fieldsErrors: Map(),
          hasChanged: false,
        }),
      );
    });
  });

  describe('DRAFT_DISCARD', () => {
    it('should discard the draft and return initial state', () => {
      expect(reducer(initialState, actions.discardDraft())).toEqual(initialState);
    });
  });

  describe('DRAFT_CHANGE', () => {
    it.skip('should update the draft', () => {
      const newEntry = {
        ...entry,
        raw: 'updated',
      };
      expect(reducer(initialState, actions.changeDraft(newEntry))).toEqual(
        fromJS({
          entry: {
            ...entry,
            raw: 'updated',
          },
          mediaFiles: [],
          hasChanged: true,
        }),
      );
    });
  });

  describe('persisting', () => {
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
});
