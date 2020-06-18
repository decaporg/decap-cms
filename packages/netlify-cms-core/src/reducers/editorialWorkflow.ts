import { Map, List, fromJS } from 'immutable';
import { startsWith } from 'lodash';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
import {
  UNPUBLISHED_ENTRY_REQUEST,
  UNPUBLISHED_ENTRY_REDIRECT,
  UNPUBLISHED_ENTRY_SUCCESS,
  UNPUBLISHED_ENTRIES_REQUEST,
  UNPUBLISHED_ENTRIES_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
  UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
  UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
  UNPUBLISHED_ENTRY_DELETE_SUCCESS,
} from '../actions/editorialWorkflow';
import { CONFIG_SUCCESS } from '../actions/config';
import { EditorialWorkflowAction, EditorialWorkflow, Entities } from '../types/redux';

const unpublishedEntries = (state = Map(), action: EditorialWorkflowAction) => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const publishMode = action.payload && action.payload.get('publish_mode');
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
          }),
        );
      });

    case UNPUBLISHED_ENTRY_PERSIST_REQUEST: {
      // Update Optimistically
      return state.withMutations(map => {
        map.setIn(
          ['entities', `${action.payload!.collection}.${action.payload!.entry.get('slug')}`],
          fromJS(action.payload!.entry),
        );
        map.setIn(
          [
            'entities',
            `${action.payload!.collection}.${action.payload!.entry.get('slug')}`,
            'isPersisting',
          ],
          true,
        );
        map.updateIn(['pages', 'ids'], List(), list =>
          list.push(action.payload!.entry.get('slug')),
        );
      });
    }

    case UNPUBLISHED_ENTRY_PERSIST_SUCCESS:
      // Update Optimistically
      return state.deleteIn([
        'entities',
        `${action.payload!.collection}.${action.payload!.slug}`,
        'isPersisting',
      ]);

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST:
      // Update Optimistically
      return state.withMutations(map => {
        map.setIn(
          ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'status'],
          action.payload!.newStatus,
        );
        map.setIn(
          ['entities', `${action.payload!.collection}.${action.payload!.slug}`, 'isUpdatingStatus'],
          true,
        );
      });

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS:
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

    case UNPUBLISHED_ENTRY_PUBLISH_SUCCESS:
    case UNPUBLISHED_ENTRY_PUBLISH_FAILURE:
      return state.withMutations(map => {
        map.deleteIn(['entities', `${action.payload!.collection}.${action.payload!.slug}`]);
      });

    case UNPUBLISHED_ENTRY_DELETE_SUCCESS:
      return state.deleteIn(['entities', `${action.payload!.collection}.${action.payload!.slug}`]);

    default:
      return state;
  }
};

export const selectUnpublishedEntry = (
  state: EditorialWorkflow,
  collection: string,
  slug: string,
) => state && state.getIn(['entities', `${collection}.${slug}`]);

export const selectUnpublishedEntriesByStatus = (state: EditorialWorkflow, status: string) => {
  if (!state) return null;
  const entities = state.get('entities') as Entities;
  return entities.filter(entry => entry.get('status') === status).valueSeq();
};

export const selectUnpublishedSlugs = (state: EditorialWorkflow, collection: string) => {
  if (!state.get('entities')) return null;
  const entities = state.get('entities') as Entities;
  return entities
    .filter((_v, k) => startsWith(k as string, `${collection}.`))
    .map(entry => entry.get('slug'))
    .valueSeq();
};

export default unpublishedEntries;
