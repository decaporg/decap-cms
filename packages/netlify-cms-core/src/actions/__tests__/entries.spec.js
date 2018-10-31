import { TestBackend } from 'netlify-cms-backend-test/src';
import { registerBackend } from 'Lib/registry';

import { Map, List, fromJS, OrderedMap } from 'immutable';
import * as actions from 'Actions/entries';
import reducer from 'Reducers/entryDraft';

const initialState = Map({
  entry: Map(),
  mediaFiles: List(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
});

const config = Map({
  backend: Map({ name: 'test-repo' }),
  media_folder: 'baz',
  collections: [
    OrderedMap({
      name: 'posts',
      folder: '_posts',
      fields: fromJS([{ name: 'title', widget: 'string' }]),
      type: 'folder_based_collection',
    }),
  ],
});

describe('entries', () => {
  describe('persistEntry', () => {
    it('should retain all unconfigured field values after persisting', () => {
      registerBackend('test-repo', TestBackend);

      const entry = {
        collection: 'posts',
        type: actions.DRAFT_CREATE_FROM_ENTRY,
        slug: 'slug',
        path: 'content/blog/art-and-wine-festival.md',
        partial: false,
        raw: '',
        data: {
          title: { name: 'title', widget: 'string', value: 'Test entry' },
          tag: { name: 'tag', widget: 'hidden', value: 'Unknown field value' },
        },
        metaData: null,
      };

      const newState = reducer(initialState, actions.createDraftFromEntry(fromJS(entry)));

      const entryState = {
        entryDraft: Map({
          entry: newState.get('entry'),
          fieldsErrors: List([]),
          mediaFiles: List([]),
        }),
        config: config,
      };

      const persistEntry = actions.persistEntry(config.get('collections')[0]);
      let persistedEntry;

      return persistEntry(
        payload => {
          persistedEntry =
            payload.type === actions.ENTRY_PERSIST_SUCCESS ? payload.payload.entry : Map({});
        },
        () => entryState,
      ).then(() => {
        expect(persistedEntry.get('data')).toEqual(
          fromJS({
            title: { name: 'title', widget: 'string', value: 'Test entry' },
            tag: { name: 'tag', widget: 'hidden', value: 'Unknown field value' },
          }),
        );
      });
    });
  });
});
