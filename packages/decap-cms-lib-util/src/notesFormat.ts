/**
 * How a note is encoded inside a comment on the host.
 *
 * A note is an ordinary comment with a leading HTML comment carrying what the
 * comment itself cannot express: whether the note is resolved, and — when the
 * account that posted it is not the editor who wrote it — who did. Hosts render
 * HTML comments invisibly, so the marker stays out of the way when the thread
 * is read on the host's own site.
 *
 * This lives in lib-util because the encoding has to be identical everywhere.
 * Two backends with their own copy of the regex is how a repository moved from
 * one host to another silently loses every resolved flag.
 */
import type { Note } from './implementation';

const STATUS_RESOLVED = 'RESOLVED';
const STATUS_OPEN = 'OPEN';

/**
 * `Author` and `AuthorId` are optional in the pattern: notes written before
 * they were recorded, and comments typed straight into the thread on the host,
 * both still parse — they simply have no recorded author and fall back to the
 * account that posted them.
 */
const NOTE_PATTERN =
  /^<!-- DecapCMS Note - Status: (RESOLVED|OPEN)(?: - Author: (.*?))?(?: - AuthorId: (.*?))? -->([\s\S]+)$/;

/** `-->` inside a field would close the HTML comment early and take the rest of
 *  the marker — and the note's first line — with it. */
function safe(value: string) {
  return value.replace(/--+>/g, '');
}

export interface ParsedNoteBody {
  content: string;
  resolved: boolean;
  /** Absent unless the note recorded one; the caller falls back to the poster. */
  author?: string;
  authorId?: string;
}

export function formatNoteBody(
  note: Pick<Note, 'content' | 'resolved'> & Partial<Pick<Note, 'author' | 'authorId'>>,
) {
  const status = note.resolved ? STATUS_RESOLVED : STATUS_OPEN;
  // Both or neither: `Author` alone would freeze a display name into the note
  // while ownership still resolved by another route, and a name with no id to
  // compare against buys nothing. A backend that records no id writes the
  // original format, unchanged.
  const identity =
    note.authorId && note.author
      ? ` - Author: ${safe(note.author)} - AuthorId: ${safe(note.authorId)}`
      : '';

  return `<!-- DecapCMS Note - Status: ${status}${identity} -->
${note.content}`;
}

export function parseNoteBody(body: string): ParsedNoteBody {
  const match = body.match(NOTE_PATTERN);

  return {
    content: (match ? match[4] : body).trim(),
    resolved: match ? match[1] === STATUS_RESOLVED : false,
    author: match?.[2]?.trim() || undefined,
    authorId: match?.[3]?.trim() || undefined,
  };
}
