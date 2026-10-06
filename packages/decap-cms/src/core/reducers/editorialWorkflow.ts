import { createSelector } from '@reduxjs/toolkit';
import { produce } from 'immer';
import { startsWith } from 'lodash-es';

import { CONFIG_SUCCESS } from '@/core/actions/config';
import {
  UNPUBLISHED_ENTRIES_FAILURE,
  UNPUBLISHED_ENTRIES_REQUEST,
  UNPUBLISHED_ENTRIES_SUCCESS,
  UNPUBLISHED_ENTRY_DELETE_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_FAILURE,
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
  UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
  UNPUBLISHED_ENTRY_PUBLISH_SCHEDULE_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_UNSCHEDULE_SUCCESS,
  UNPUBLISHED_ENTRY_REDIRECT,
  UNPUBLISHED_ENTRY_REQUEST,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
  UNPUBLISHED_ENTRY_SUCCESS,
} from '@/core/actions/editorialWorkflow';
import { EDITORIAL_WORKFLOW, status as statusValues } from '@/core/constants/publishModes';

import type { AnyAction } from 'redux';

export type WorkflowEntry = {
  slug: string,
  collection: string,
  status?: string,
  isFetching?: boolean,
  isPersisting?: boolean,
  isUpdatingStatus?: boolean,
  isPublishing?: boolean,
  // ISO-8601 timestamp; presence means the entry is scheduled to auto-publish
  // once due (DCMS-1991). Client-side only - see core/lib/scheduledPublish.
  publishAt?: string,
  [key: string]: unknown,
};

export type WorkflowPage = { isFetching?: boolean, ids?: string[] };

export type EditorialWorkflow = {
  pages: Record<string, WorkflowPage | boolean | undefined> & { isFetching?: boolean },
  entities: Record<string, WorkflowEntry>,
};

const defaultState: EditorialWorkflow = { entities: {}, pages: {} };

const unpublishedEntries = produce((state: EditorialWorkflow, action: AnyAction) => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const publishMode = action.payload?.publish_mode;
      if (publishMode === EDITORIAL_WORKFLOW) {
        return { entities: {}, pages: {} };
      }
      return;
    }

    case UNPUBLISHED_ENTRY_REQUEST: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      state.entities[key] = { ...(state.entities[key] ?? {}), isFetching: true };
      break;
    }

    case UNPUBLISHED_ENTRY_REDIRECT: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      delete state.entities[key];
      break;
    }

    case UNPUBLISHED_ENTRY_SUCCESS: {
      const key = `${action.payload.collection}.${action.payload.entry.slug}`;
      state.entities[key] = action.payload.entry;
      break;
    }

    case UNPUBLISHED_ENTRIES_REQUEST: {
      state.pages = { ...state.pages, isFetching: true };
      break;
    }

    case UNPUBLISHED_ENTRIES_SUCCESS: {
      (action.payload.entries as WorkflowEntry[]).forEach(entry => {
        const key = `${entry.collection}.${entry.slug}`;
        state.entities[key] = { ...entry, isFetching: false };
      });
      state.pages = {
        ...action.payload.pages,
        ids: (action.payload.entries as WorkflowEntry[]).map(entry => entry.slug),
      };
      break;
    }

    case UNPUBLISHED_ENTRIES_FAILURE: {
      // Without this the workflow board kept showing its loader after a
      // failed load, and the flag never cleared for a retry.
      state.pages = { ...state.pages, isFetching: false };
      break;
    }

    case UNPUBLISHED_ENTRY_PERSIST_REQUEST: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        state.entities[key] = { ...state.entities[key], isPersisting: true };
      }
      break;
    }

    case UNPUBLISHED_ENTRY_PERSIST_SUCCESS: {
      const slug = action.payload.entry.slug;
      const key = `${action.payload.collection}.${slug}`;
      state.entities[key] = { ...action.payload.entry, isPersisting: undefined };
      const page = state.pages[action.payload.collection] as WorkflowPage | undefined;
      if (page?.ids && !page.ids.includes(slug)) {
        (state.pages[action.payload.collection] as WorkflowPage).ids = [...page.ids, slug];
      }
      break;
    }

    case UNPUBLISHED_ENTRY_PERSIST_FAILURE: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        state.entities[key] = { ...state.entities[key], isPersisting: false };
      }
      break;
    }

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        state.entities[key] = { ...state.entities[key], isUpdatingStatus: true };
      }
      break;
    }

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        state.entities[key] = {
          ...state.entities[key],
          status: action.payload.newStatus,
          isUpdatingStatus: false,
        };
      }
      break;
    }

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        state.entities[key] = { ...state.entities[key], isUpdatingStatus: false };
      }
      break;
    }

    case UNPUBLISHED_ENTRY_PUBLISH_REQUEST: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        state.entities[key] = { ...state.entities[key], isPublishing: true };
      }
      break;
    }

    case UNPUBLISHED_ENTRY_PUBLISH_SUCCESS:
    case UNPUBLISHED_ENTRY_DELETE_SUCCESS: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      delete state.entities[key];
      break;
    }

    case UNPUBLISHED_ENTRY_PUBLISH_SCHEDULE_SUCCESS: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        state.entities[key] = { ...state.entities[key], publishAt: action.payload.publishAt };
      }
      break;
    }

    case UNPUBLISHED_ENTRY_PUBLISH_UNSCHEDULE_SUCCESS: {
      const key = `${action.payload.collection}.${action.payload.slug}`;
      if (state.entities[key]) {
        const nextEntity = { ...state.entities[key] };
        delete nextEntity.publishAt;
        state.entities[key] = nextEntity;
      }
      break;
    }

    case UNPUBLISHED_ENTRY_PUBLISH_FAILURE:
    default:
      break;
  }
}, defaultState);

export function selectUnpublishedEntry(
  state: EditorialWorkflow,
  collection: string,
  slug: string,
): WorkflowEntry | undefined {
  return state?.entities?.[`${collection}.${slug}`];
}

export function selectUnpublishedEntriesByStatus(state: EditorialWorkflow, status: string) {
  if (!state) return undefined;
  return Object.values(state.entities).filter(entry => entry?.status === status);
}

// Memoized selector that groups all unpublished entries by status. Returns a
// stable reference when `entities` hasn't changed, preventing the workflow
// board from rerendering on every unrelated app-wide dispatch (DCMS-351,
// porting the DCMS-077 fix).
//
// createSelector is lazily created on first call rather than at module init:
// rolldown's lazy-init bundling hoists top-level createSelector(...) calls
// ahead of reselect's own lazy init, crashing with
// "createSelector$1 is not a function" (DCMS-565).
let _selectUnpublishedEntriesGroupedByStatus: ReturnType<typeof createSelector> | undefined;
export const selectUnpublishedEntriesGroupedByStatus = (state: EditorialWorkflow) => {
  if (!_selectUnpublishedEntriesGroupedByStatus) {
    _selectUnpublishedEntriesGroupedByStatus = createSelector(
      (s: EditorialWorkflow) => s?.entities,
      entities => {
        const grouped: Record<string, WorkflowEntry[]> = {};
        Object.values(statusValues).forEach(currStatus => {
          grouped[currStatus] = entities
            ? Object.values(entities).filter(entry => entry?.status === currStatus)
            : [];
        });
        return grouped;
      },
    );
  }
  return _selectUnpublishedEntriesGroupedByStatus(state);
};

export function selectUnpublishedSlugs(state: EditorialWorkflow, collection: string) {
  if (!state?.entities) return null;
  return Object.entries(state.entities)
    .filter(([k]) => startsWith(k, `${collection}.`))
    .map(([, entry]) => entry?.slug);
}

export default unpublishedEntries;
