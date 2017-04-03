import { Map, List, fromJS } from 'immutable';
import {
  DRAFT_CREATE_FROM_ENTRY,
  DRAFT_CREATE_EMPTY,
  DRAFT_DISCARD,
  DRAFT_CHANGE_FIELD,
  DRAFT_VALIDATION_ERRORS,
  ENTRY_PERSIST_REQUEST,
  ENTRY_PERSIST_SUCCESS,
  ENTRY_PERSIST_FAILURE,
  ENTRY_DELETE_SUCCESS,
} from '../actions/entries';
import {
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_FAILURE,
  UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
} from '../actions/editorialWorkflow';
import {
  ADD_ASSET,
  REMOVE_ASSET,
} from '../actions/media';

const initialState = Map({
  entry: Map(),
  mediaFiles: List(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
});

const entryDraftReducer = (state = Map(), action) => {
  switch (action.type) {
    case DRAFT_CREATE_FROM_ENTRY:
      // Existing Entry
      return state.withMutations((state) => {
        state.set('entry', action.payload);
        state.setIn(['entry', 'newRecord'], false);
        state.set('mediaFiles', List());
        state.set('fieldsMetaData', Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', false);
      });
    case DRAFT_CREATE_EMPTY:
      // New Entry
      return state.withMutations((state) => {
        state.set('entry', fromJS(action.payload));
        state.setIn(['entry', 'newRecord'], true);
        state.set('mediaFiles', List());
        state.set('fieldsMetaData', Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', false);
      });
    case DRAFT_DISCARD:
      return initialState;
    case DRAFT_CHANGE_FIELD:
      return state.withMutations((state) => {
        state.setIn(['entry', 'data', action.payload.field], action.payload.value);
        state.mergeIn(['fieldsMetaData'], fromJS(action.payload.metadata));
        state.set('hasChanged', true);
      });
    
    case DRAFT_VALIDATION_ERRORS:
      if (action.payload.errors.length === 0) {
        return state.deleteIn(['fieldsErrors', action.payload.field]);
      } else {
        return state.setIn(['fieldsErrors', action.payload.field], action.payload.errors);
      }

    case ENTRY_PERSIST_REQUEST:
    case UNPUBLISHED_ENTRY_PERSIST_REQUEST: {
      return state.setIn(['entry', 'isPersisting'], true);
    }

    case ENTRY_PERSIST_FAILURE:
    case UNPUBLISHED_ENTRY_PERSIST_FAILURE: {
      return state.deleteIn(['entry', 'isPersisting']);
    }

    case ENTRY_PERSIST_SUCCESS:
    case ENTRY_DELETE_SUCCESS:
    case UNPUBLISHED_ENTRY_PERSIST_SUCCESS:
    case UNPUBLISHED_ENTRY_PUBLISH_SUCCESS:
      return state.withMutations((state) => {
        state.deleteIn(['entry', 'isPersisting']);
        state.set('hasChanged', false);
      });

    case ADD_ASSET:
      return state.update('mediaFiles', list => list.push(action.payload.public_path));
    case REMOVE_ASSET:
      return state.update('mediaFiles', list => list.filterNot(path => path === action.payload));

    default:
      return state;
  }
};

export default entryDraftReducer;
