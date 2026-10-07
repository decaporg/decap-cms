/**
 * Editor notes (decaporg #7563 / #7994): comments on an entry, shown in the
 * editor's notes pane while the entry is under the editorial workflow. A git
 * backend stores them as comments on a companion issue per entry, so the
 * thread stays readable on the host and survives the pull/merge request.
 */

import type { CmsConfig } from '@/lib/util/index';

export interface Note {
  id: string;
  avatarUrl?: string | undefined;
  content: string;
  timestamp: string;
  /** Display name; not unique, so never compare on it when `authorId` is set. */
  author: string;
  /** Unique id of the note's author; absent when the poster is the author. */
  authorId?: string | undefined;
  /** Whether the signed-in editor wrote this note. */
  isOwn?: boolean | undefined;
  entrySlug: string;
  resolved: boolean;
  /** Link to the thread on the host. */
  issueUrl?: string | undefined;
}

/** One comment in a host thread, as the notes helpers consume it. */
export interface CommentData {
  id: number | string;
  body: string;
  user: {
    login: string,
    avatar_url: string,
  } | null;
  created_at: string;
  updated_at: string;
}

/** A host thread (issue or pull/merge request) and its comments. */
export interface IssueState {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  updated_at: string;
  comments: CommentData[];
  labels: { name: string, color: string }[];
  html_url: string;
}

export type ChangeType =
  | 'comment_added'
  | 'comment_updated'
  | 'comment_deleted'
  | 'issue_state_changed'
  | 'issue_labels_changed';

export type IssueChangeData =
  | CommentData
  | { from: 'open' | 'closed', to: 'open' | 'closed' }
  | { from: { name: string, color: string }[], to: { name: string, color: string }[] };

export interface IssueChange {
  type: ChangeType;
  data: IssueChangeData;
  previousData?: CommentData | undefined;
  timestamp: string;
}

export interface NotesWatchCallbacks {
  onUpdate?: ((notes: Note[], changes: IssueChange[]) => void) | undefined;
  onChange?: ((change: IssueChange) => void) | undefined;
  prepareNotes?: ((notes: Note[]) => Note[] | Promise<Note[]>) | undefined;
}

/**
 * Whether any collection or file can show notes. Publishing and deleting look
 * the entry's notes thread up with a search request, which backends skip for
 * sites that never use notes.
 */
export function notesConfigured(config: Pick<Partial<CmsConfig>, 'editor' | 'collections'>) {
  return !!config.editor?.notes
    || (config.collections || []).some(
      collection => collection.editor?.notes || collection.files?.some(file => file.editor?.notes),
    );
}
