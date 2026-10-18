import { Map, List, fromJS } from 'immutable';
import startsWith from 'lodash/startsWith';
import { generateContentKey } from 'decap-cms-lib-util';

import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
import {
  UNPUBLISHED_ENTRY_REQUEST,
  UNPUBLISHED_ENTRY_REDIRECT,
  UNPUBLISHED_ENTRY_SUCCESS,
  UNPUBLISHED_ENTRIES_REQUEST,
  UNPUBLISHED_ENTRIES_SUCCESS,
  UNPUBLISHED_ENTRIES_FAILURE,
  UNPUBLISHED_KEYS_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_FAILURE,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
  UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
  UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
  UNPUBLISHED_ENTRY_DELETE_SUCCESS,
} from '../actions/editorialWorkflow';
import { CONFIG_SUCCESS } from '../actions/config';

import type { EditorialWorkflowAction, EditorialWorkflow, Entities } from '../types/redux';

function unionKeys(state: Map<unknown, unknown>, fetchedKeys: List<string>) {
  const previousKeys = (state.getIn(['pages', 'keys']) as List<string>) || List<string>();
  return fetchedKeys.concat(previousKeys.filter(key => !fetchedKeys.includes(key)));
}

function unpublishedEntries(state = Map(), action: EditorialWorkflowAction) {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const publishMode = action.payload && action.payload.publish_mode;
      if (publishMode === EDITORIAL_WORKFLOW) {
        //  Editorial workflow state is explicitly initiated after the config.
        return Map({ entities: Map(), pages: Map() });
      }
      return state;
    }
    case UNPUBLISHED_ENTRY_REQUEST:
      return state.setIn(
        ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isFetching'],
        true,
      );

    case UNPUBLISHED_ENTRY_REDIRECT:
      return state.deleteIn(['entities', `${action.payload!.collection}.${action.payload!.slug}`]);

    case UNPUBLISHED_ENTRY_SUCCESS:
      return state.setIn(
        ['entities', `${action.payload!.collection}.${action.payload!.entry.slug}`],
        fromJS(action.payload!.entry),
      );

    case UNPUBLISHED_ENTRIES_REQUEST:
      return state.withMutations(map => {
        map.setIn(['pages', 'isFetching'], true);
        map.deleteIn(['pages', 'error']);
      });

    case UNPUBLISHED_ENTRIES_SUCCESS: {
      const fetchedKeys = List(
        action.payload!.entries.map(entry => generateContentKey(entry.collection, entry.slug)),
      );
      // Union, not replace: the listing may predate a commit this session made,
      // and dropping its key makes loadUnpublishedEntry treat a live draft as
      // published. Publishing and deleting prune keys explicitly.
      const keys = unionKeys(state, fetchedKeys);

      return state.withMutations(map => {
        action.payload!.entries.forEach(entry =>
          map.setIn(
            ['entities', `${entry.collection}.${entry.slug}`],
            fromJS({ ...entry, isFetching: false }),
          ),
        );
        map.set(
          'pages',
          Map({
            ...action.payload!.pages,
            ids: List(action.payload!.entries.map(entry => entry.slug)),
            // Collection-qualified content keys; loadUnpublishedEntry treats an
            // absent key as proof the entry is not under editorial workflow.
            keys,
          }),
        );
      });
    }

    // The key set on its own, unioned as above. Leaves `ids` alone: that means
    // "the entries themselves are loaded", and claiming it would suppress the load.
    case UNPUBLISHED_KEYS_SUCCESS:
      return state.setIn(['pages', 'keys'], unionKeys(state, List(action.payload!.keys)));

    // `pages.error` stops the collection view retrying a failed load on every
    // re-render. A new request or a success clears it.
    case UNPUBLISHED_ENTRIES_FAILURE: {
      const error = action.payload as unknown as Error | undefined;
      return state.withMutations(map => {
        map.setIn(['pages', 'isFetching'], false);
        map.setIn(['pages', 'error'], error?.message || 'Failed to load entries');
      });
    }

    case UNPUBLISHED_ENTRY_PERSIST_REQUEST: {
      return state.setIn(
        ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isPersisting'],
        true,
      );
    }

    case UNPUBLISHED_ENTRY_PERSIST_SUCCESS:
      // Update Optimistically
      return state.withMutations(map => {
        map.setIn(
          ['entities', `${action.payload!.collection}.${action.payload!.entry.get('slug')}`],
          fromJS(action.payload!.entry),
        );
        map.deleteIn([
          'entities',
          `${action.payload!.collection}.${action.payload!.entry.get('slug')}`,
          'isPersisting',
        ]);
        map.updateIn(['pages', 'ids'], List(), list =>
          (list as List<string>).push(action.payload!.entry.get('slug')),
        );
        // Keyed on payload.slug, the slug the backend committed under: a new
        // entry's draft has none, and `<collection>/` would read as published.
        map.updateIn(['pages', 'keys'], List(), list => {
          const slug = action.payload!.slug || action.payload!.entry.get('slug');
          const keys = list as List<string>;
          if (!slug) {
            return keys;
          }
          const key = generateContentKey(action.payload!.collection, slug);
          return keys.includes(key) ? keys : keys.push(key);
        });
      });

    case UNPUBLISHED_ENTRY_PERSIST_FAILURE:
      return state.setIn(
        ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isPersisting'],
        false,
      );

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST:
      // Update Optimistically
      return state.setIn(
        ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isUpdatingStatus'],
        true,
      );

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS:
      return state.withMutations(map => {
        map.setIn(
          ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'status'],
          action.payload!.newStatus,
        );
        map.setIn(
          ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isUpdatingStatus'],
          false,
        );
      });

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE:
      return state.setIn(
        ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isUpdatingStatus'],
        false,
      );

    case UNPUBLISHED_ENTRY_PUBLISH_REQUEST:
      return state.setIn(
        ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isPublishing'],
        true,
      );

    // Publishing and deleting close the workflow branch, so the key goes too.
    case UNPUBLISHED_ENTRY_PUBLISH_SUCCESS:
    case UNPUBLISHED_ENTRY_DELETE_SUCCESS:
      return state.withMutations(map => {
        map.deleteIn(['entities', `${action.payload!.collection}.${action.payload!.slug}`]);
        map.updateIn(['pages', 'keys'], List(), list => {
          const key = generateContentKey(action.payload!.collection, action.payload!.slug);
          return (list as List<string>).filter(existing => existing !== key);
        });
      });

    case UNPUBLISHED_ENTRY_PUBLISH_FAILURE:
    default:
      return state;
  }
}

export function selectUnpublishedEntry(state: EditorialWorkflow, collection: string, slug: string) {
  return state && state.getIn(['entities', `${collection}.${slug}`]);
}

export function selectUnpublishedEntriesByStatus(state: EditorialWorkflow, status: string) {
  if (!state) return null;
  const entities = state.get('entities') as Entities;
  return entities.filter(entry => entry.get('status') === status).valueSeq();
}

export function selectUnpublishedSlugs(state: EditorialWorkflow, collection: string) {
  if (!state.get('entities')) return null;
  const entities = state.get('entities') as Entities;
  return entities
    .filter((_v, k) => startsWith(k as string, `${collection}.`))
    .map(entry => entry.get('slug'))
    .valueSeq();
}

export default unpublishedEntries;
