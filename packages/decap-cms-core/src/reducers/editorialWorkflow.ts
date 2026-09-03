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
      return state.setIn(['pages', 'isFetching'], true);

    case UNPUBLISHED_ENTRIES_SUCCESS:
      return state.withMutations(map => {
        action.payload!.entries.forEach(entry =>
          map.setIn(
            ['entities', `${entry.collection}.${entry.slug}`],
            fromJS(entry).set('isFetching', false),
          ),
        );
        map.set(
          'pages',
          Map({
            ...action.payload!.pages,
            ids: List(action.payload!.entries.map(entry => entry.slug)),
            // Which entries are under editorial workflow, collection-qualified
            // so two collections may hold the same slug. Read by
            // loadUnpublishedEntry, which treats "this key is absent" as proof
            // the entry is not under editorial workflow.
            keys: List(
              action.payload!.entries.map(entry =>
                generateContentKey(entry.collection, entry.slug),
              ),
            ),
            // When those keys were last known to match the backend — the proof
            // above is only as good as its age.
            loadedAt: Date.now(),
          }),
        );
      });

    // The key set on its own, from the one call that lists the open workflow
    // branches. Deliberately leaves `ids` alone: that flag means "the entries
    // themselves are loaded", which the Workflow board and the collection view
    // both act on, and claiming it here would suppress the load they need.
    case UNPUBLISHED_KEYS_SUCCESS:
      return state.withMutations(map => {
        map.setIn(['pages', 'keys'], List(action.payload!.keys));
        map.setIn(['pages', 'loadedAt'], Date.now());
      });

    case UNPUBLISHED_ENTRIES_FAILURE:
      return state.setIn(['pages', 'isFetching'], false);

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
          list.push(action.payload!.entry.get('slug')),
        );
        // The entry this session just put into review is in the workflow, so
        // the key set says so without a round trip. `loadedAt` is deliberately
        // NOT refreshed: this proves one key, not the whole set, and resetting
        // the staleness clock without asking the backend would let a
        // colleague's draft go unnoticed for another full window — the exact
        // failure the window bounds.
        map.updateIn(['pages', 'keys'], List(), list => {
          const key = generateContentKey(
            action.payload!.collection,
            action.payload!.entry.get('slug'),
          );
          return list.includes(key) ? list : list.push(key);
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

    // Publishing and deleting both close the workflow branch, so the key has
    // to go with the entity — otherwise loadUnpublishedEntry would keep
    // treating the entry as a draft and ask the backend for a branch that no
    // longer exists.
    case UNPUBLISHED_ENTRY_PUBLISH_SUCCESS:
    case UNPUBLISHED_ENTRY_DELETE_SUCCESS:
      return state.withMutations(map => {
        map.deleteIn(['entities', `${action.payload!.collection}.${action.payload!.slug}`]);
        map.updateIn(['pages', 'keys'], List(), list => {
          const key = generateContentKey(action.payload!.collection, action.payload!.slug);
          return list.filter((existing: string) => existing !== key);
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
