import { Map, List, fromJS } from 'immutable';
import { v4 as uuid } from 'uuid';
import get from 'lodash/get';
import { join } from 'path';

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
} from '../actions/entries';
import {
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_FAILURE,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
  UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
  UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
} from '../actions/editorialWorkflow';
import { selectFolderEntryExtension, selectHasMetaPath } from './collections';
import { getDataPath, duplicateI18nFields } from '../lib/i18n';

const initialState = Map({
  entry: Map(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
  key: '',
});

function entryDraftReducer(state = Map(), action) {
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
        const { field, value, metadata, entries, i18n } = action.payload;
        const name = field.get('name');
        const meta = field.get('meta');

        const dataPath = (i18n && getDataPath(i18n.currentLocale, i18n.defaultLocale)) || ['data'];
        if (meta) {
          state.setIn(['entry', 'meta', name], value);
        } else {
          state.setIn(['entry', ...dataPath, name], value);
          if (i18n) {
            state = duplicateI18nFields(state, field, i18n.locales, i18n.defaultLocale);
          }
        }
        state.mergeDeepIn(['fieldsMetaData'], fromJS(metadata));
        const newData = state.getIn(['entry', ...dataPath]);
        const newMeta = state.getIn(['entry', 'meta']);
        state.set(
          'hasChanged',
          !entries.some(e => newData.equals(e.get(...dataPath))) ||
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
      const { uniqueFieldId } = action.payload;
      return state.deleteIn(['fieldsErrors', uniqueFieldId]);
    }

    case ENTRY_PERSIST_REQUEST:
    case UNPUBLISHED_ENTRY_PERSIST_REQUEST: {
      return state.setIn(['entry', 'isPersisting'], true);
    }

    case ENTRY_PERSIST_FAILURE:
    case UNPUBLISHED_ENTRY_PERSIST_FAILURE: {
      return state.deleteIn(['entry', 'isPersisting']);
    }

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST:
      return state.setIn(['entry', 'isUpdatingStatus'], true);

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE:
    case UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS:
      return state.deleteIn(['entry', 'isUpdatingStatus']);

    case UNPUBLISHED_ENTRY_PUBLISH_REQUEST:
      return state.setIn(['entry', 'isPublishing'], true);

    case UNPUBLISHED_ENTRY_PUBLISH_SUCCESS:
    case UNPUBLISHED_ENTRY_PUBLISH_FAILURE:
      return state.deleteIn(['entry', 'isPublishing']);

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
}

export function selectCustomPath(collection, entryDraft) {
  if (!selectHasMetaPath(collection)) {
    return;
  }
  const meta = entryDraft.getIn(['entry', 'meta']);
  const path = meta && meta.get('path');
  const indexFile = get(collection.toJS(), ['meta', 'path', 'index_file']);
  const extension = selectFolderEntryExtension(collection);
  const customPath = path && join(collection.get('folder'), path, `${indexFile}.${extension}`);
  return customPath;
}

export default entryDraftReducer;
