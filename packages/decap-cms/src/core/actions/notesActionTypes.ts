/**
 * Editor notes action types (decaporg #7563). A dependency-free module so the
 * entryDraft reducer can import them without pulling in the notes thunks and,
 * through them, the backend.
 */
export const DRAFT_NOTES_LOAD = 'DRAFT_NOTES_LOAD';
export const DRAFT_NOTE_ADD = 'DRAFT_NOTE_ADD';
export const DRAFT_NOTE_UPDATE = 'DRAFT_NOTE_UPDATE';
export const DRAFT_NOTE_DELETE = 'DRAFT_NOTE_DELETE';
