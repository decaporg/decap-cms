/**
 * Editor notes (decaporg #7563 / #7994): load, poll and persist the notes of
 * the entry open in the editor. The notes themselves live in
 * `state.entryDraft.notes`.
 */
import { currentBackend } from '@/core/backend';
import { selectEntryCollectionTitle } from '@/core/reducers/collections';
import { DRAFT_NOTE_ADD, DRAFT_NOTE_DELETE, DRAFT_NOTE_UPDATE, DRAFT_NOTES_LOAD } from './notesActionTypes';
import { addNotification } from './notifications';

import type { Note } from '@/lib/backend/index';
import type { CmsCollectionState } from '@/lib/util/index';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

type State = any;
type Dispatch = ThunkDispatch<State, {}, AnyAction>;
type Collection = CmsCollectionState;

export function loadNotesForEntry(notes: Note[]) {
  return { type: DRAFT_NOTES_LOAD, payload: { notes } } as const;
}

export function addDraftNote(note: Note) {
  return { type: DRAFT_NOTE_ADD, payload: { note } } as const;
}

export function updateDraftNote(id: string, updates: Partial<Note>) {
  return { type: DRAFT_NOTE_UPDATE, payload: { id, updates } } as const;
}

export function deleteDraftNote(id: string) {
  return { type: DRAFT_NOTE_DELETE, payload: { id } } as const;
}

function notifyError(key: string, error: unknown) {
  return addNotification({
    message: { key, details: error instanceof Error ? error.message : String(error) },
    type: 'error',
    dismissAfter: 8000,
  });
}

function notifySuccess(key: string) {
  return addNotification({ message: { key }, type: 'success', dismissAfter: 4000 });
}

/** Whether the open draft is still this entry; late results for another entry are dropped. */
function isOpenEntry(state: State, slug: string) {
  return state.entryDraft?.entry?.slug === slug;
}

/** Keep the open entry's notes current while it stays open, when the backend can. */
export function startNotesPolling(collection: Collection, slug: string) {
  return async (dispatch: Dispatch, getState: () => State) => {
    try {
      const backend = currentBackend(getState().config);
      if (!backend.supportsNotesPolling()) {
        return;
      }
      await backend.startNotesPolling(collection.name, slug, {
        onUpdate: notes => {
          if (!isOpenEntry(getState(), slug)) {
            return;
          }
          dispatch(loadNotesForEntry(notes.map(note => ({ ...note, entrySlug: slug }))));
        },
      });
    } catch (error) {
      console.error('[DecapNotes Polling] Failed to start notes polling:', error);
    }
  };
}

export function stopNotesPolling(collection: Collection, slug: string) {
  return async (_dispatch: Dispatch, getState: () => State) => {
    try {
      await currentBackend(getState().config).stopNotesPolling(collection.name, slug);
    } catch (error) {
      console.error('[DecapNotes Polling] Failed to stop notes polling:', error);
    }
  };
}

export function loadNotes(collection: Collection, slug: string) {
  return async (dispatch: Dispatch, getState: () => State) => {
    try {
      const backend = currentBackend(getState().config);
      const notes = await backend.getNotes(collection.name, slug);
      if (!isOpenEntry(getState(), slug)) {
        return;
      }
      dispatch(loadNotesForEntry(notes.map(note => ({ ...note, entrySlug: slug }))));
      await dispatch(startNotesPolling(collection, slug));
    } catch (error) {
      console.error('[DecapNotes] Failed to load notes:', error);
      dispatch(loadNotesForEntry([]));
    }
  };
}

export function persistNote(collection: Collection, slug: string, note: Omit<Note, 'id'>) {
  return async (dispatch: Dispatch, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    // Named off the open draft: the same title the collection list shows,
    // which a backend reading the raw file can't work out for itself.
    const draftEntry = state.entryDraft?.entry;
    const entryTitle = draftEntry && draftEntry.slug === slug
      ? selectEntryCollectionTitle(collection, draftEntry)
      : undefined;

    try {
      const saved = await backend.addNote(collection.name, slug, note, entryTitle);
      dispatch(addDraftNote({ ...saved, entrySlug: slug }));
      dispatch(notifySuccess('ui.toast.noteAdded'));
      // The entry's first note can create the thread the notes live in; watch
      // it from now on so other editors' notes show up.
      await dispatch(startNotesPolling(collection, slug));
      return saved;
    } catch (error) {
      dispatch(notifyError('ui.toast.onFailToAddNote', error));
      return undefined;
    }
  };
}

export function updateNotePersist(collection: Collection, slug: string, noteId: string, updates: Partial<Note>) {
  return async (dispatch: Dispatch, getState: () => State) => {
    const backend = currentBackend(getState().config);
    try {
      const updated = await backend.updateNote(collection.name, slug, noteId, updates);
      dispatch(updateDraftNote(noteId, updates));
      const isResolutionChange = Object.keys(updates).length === 1 && 'resolved' in updates;
      dispatch(
        notifySuccess(
          isResolutionChange
            ? updates.resolved ? 'ui.toast.noteResolved' : 'ui.toast.noteReopened'
            : 'ui.toast.noteUpdated',
        ),
      );
      return updated;
    } catch (error) {
      dispatch(notifyError('ui.toast.onFailToUpdateNote', error));
      return undefined;
    }
  };
}

export function deleteNotePersist(collection: Collection, slug: string, noteId: string) {
  return async (dispatch: Dispatch, getState: () => State) => {
    const backend = currentBackend(getState().config);
    try {
      await backend.deleteNote(collection.name, slug, noteId);
      dispatch(deleteDraftNote(noteId));
      dispatch(notifySuccess('ui.toast.noteDeleted'));
    } catch (error) {
      dispatch(notifyError('ui.toast.onFailToDeleteNote', error));
    }
  };
}
