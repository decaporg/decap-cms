import { Map, List, fromJS } from 'immutable';
import uuid from 'uuid/v4';
import {
  DRAFT_CREATE_FROM_ENTRY,
  DRAFT_CREATE_EMPTY,
  DRAFT_DISCARD,
  DRAFT_CHANGE_FIELD,
  DRAFT_VALIDATION_ERRORS,
  DRAFT_CLEAR_ERRORS,
  DRAFT_LOCAL_BACKUP_RETRIEVED,
  DRAFT_CREATE_FROM_LOCAL_BACKUP,
  DRAFT_CREATE_DUPLICATE_FROM_ENTRY,
  ENTRY_PERSIST_REQUEST,
  ENTRY_PERSIST_SUCCESS,
  ENTRY_PERSIST_FAILURE,
  ENTRY_DELETE_SUCCESS,
  ADD_DRAFT_ENTRY_MEDIA_FILE,
  REMOVE_DRAFT_ENTRY_MEDIA_FILE,
} from 'Actions/entries';
import {
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_FAILURE,
} from 'Actions/editorialWorkflow';
import { get } from 'lodash';
import { selectFolderEntryExtension, selectHasMetaPath } from './collections';
import { join } from 'path';

const initialState = Map({
  entry: Map(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
  key: '',
});

const entryDraftReducer = (state = Map(), action) => {
  switch (action.type) {
    case DRAFT_CREATE_FROM_ENTRY:
      // Existing Entry
      return state.withMutations(state => {
        state.set('entry', fromJS(action.payload.entry));
        state.setIn(['entry', 'newRecord'], false);
        state.set('fieldsMetaData', Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', false);
        state.set('key', uuid());
      });
    case DRAFT_CREATE_EMPTY:
      // New Entry
      return state.withMutations(state => {
        state.set('entry', fromJS(action.payload));
        state.setIn(['entry', 'newRecord'], true);
        state.set('fieldsMetaData', Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', false);
        state.set('key', uuid());
      });
    case DRAFT_CREATE_FROM_LOCAL_BACKUP:
      // Local Backup
      return state.withMutations(state => {
        const backupDraftEntry = state.get('localBackup');
        const backupEntry = backupDraftEntry.get('entry');
        state.delete('localBackup');
        state.set('entry', backupEntry);
        state.setIn(['entry', 'newRecord'], !backupEntry.get('path'));
        state.set('fieldsMetaData', Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', true);
        state.set('key', uuid());
      });
    case DRAFT_CREATE_DUPLICATE_FROM_ENTRY:
      // Duplicate Entry
      return state.withMutations(state => {
        state.set('entry', fromJS(action.payload));
        state.setIn(['entry', 'newRecord'], true);
        state.set('mediaFiles', List());
        state.set('fieldsMetaData', Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', true);
      });
    case DRAFT_DISCARD:
      return initialState;
    case DRAFT_LOCAL_BACKUP_RETRIEVED: {
      const { entry } = action.payload;
      const newState = new Map({
        entry: fromJS(entry),
      });
      return state.set('localBackup', newState);
    }
    case DRAFT_CHANGE_FIELD: {
      return state.withMutations(state => {
        const { field, value, metadata, entries } = action.payload;
        const name = field.get('name');
        const meta = field.get('meta');
        if (meta) {
          state.setIn(['entry', 'meta', name], value);
        } else {
          state.setIn(['entry', 'data', name], value);
        }
        state.mergeDeepIn(['fieldsMetaData'], fromJS(metadata));
        const newData = state.getIn(['entry', 'data']);
        const newMeta = state.getIn(['entry', 'meta']);
        state.set(
          'hasChanged',
          !entries.some(e => newData.equals(e.get('data'))) ||
            !entries.some(e => newMeta.equals(e.get('meta'))),
        );
      });
    }
    case DRAFT_VALIDATION_ERRORS:
      if (action.payload.errors.length === 0) {
        return state.deleteIn(['fieldsErrors', action.payload.uniquefieldId]);
      } else {
        return state.setIn(['fieldsErrors', action.payload.uniquefieldId], action.payload.errors);
      }

    case DRAFT_CLEAR_ERRORS: {
      return state.set('fieldsErrors', Map());
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
    case UNPUBLISHED_ENTRY_PERSIST_SUCCESS:
      return state.withMutations(state => {
        state.deleteIn(['entry', 'isPersisting']);
        state.set('hasChanged', false);
        if (!state.getIn(['entry', 'slug'])) {
          state.setIn(['entry', 'slug'], action.payload.slug);
        }
      });

    case ENTRY_DELETE_SUCCESS:
      return state.withMutations(state => {
        state.deleteIn(['entry', 'isPersisting']);
        state.set('hasChanged', false);
      });

    case ADD_DRAFT_ENTRY_MEDIA_FILE: {
      return state.withMutations(state => {
        const mediaFiles = state.getIn(['entry', 'mediaFiles']);

        state.setIn(
          ['entry', 'mediaFiles'],
          mediaFiles
            .filterNot(file => file.get('id') === action.payload.id)
            .insert(0, fromJS(action.payload)),
        );
        state.set('hasChanged', true);
      });
    }

    case REMOVE_DRAFT_ENTRY_MEDIA_FILE: {
      return state.withMutations(state => {
        const mediaFiles = state.getIn(['entry', 'mediaFiles']);

        state.setIn(
          ['entry', 'mediaFiles'],
          mediaFiles.filterNot(file => file.get('id') === action.payload.id),
        );
        state.set('hasChanged', true);
      });
    }

    default:
      return state;
  }
};

export const selectCustomPath = (collection, entryDraft) => {
  if (!selectHasMetaPath(collection)) {
    return;
  }
  const meta = entryDraft.getIn(['entry', 'meta']);
  const path = meta && meta.get('path');
  const indexFile = get(collection.toJS(), ['meta', 'path', 'index_file']);
  const extension = selectFolderEntryExtension(collection);
  const customPath = path && join(collection.get('folder'), path, `${indexFile}.${extension}`);
  return customPath;
};

export default entryDraftReducer;
