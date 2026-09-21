/**
 * How a note is encoded inside a comment on the host
 *
 * A note is an ordinary comment with a leading HTML comment carrying
 * whether the note is resolved and who wrote it - which can differ from
 * the account that posted it.
 * Hosts render HTML comments invisibly, so the marker stays out of the way
 * when the thread is read on the host's own site.
 *
 * Encoding is identical across backends
 */
import type { Note } from './implementation';

const MARKER_PREFIX = '<!-- DecapCMS Note ';
const MARKER_SUFFIX = ' -->';

const NOTE_PATTERN = /^<!-- DecapCMS Note (\{[\s\S]*?\}) -->\n?([\s\S]*)$/;
const LEGACY_NOTE_PATTERN = /^<!-- DecapCMS Note - Status: (RESOLVED|OPEN) -->\n?([\s\S]*)$/;

/**
 * A JSON string may contain `-->`, which would close the HTML comment early.
 * Escaping every hyphen that precedes another removes every `--`, so `-->`
 * cannot survive; `JSON.parse` decodes `\u002d` back, so it stays lossless
 * and a lone hyphen (`Jean-Luc`) stays readable.
 *
 * Replacing `--` instead is not enough - a run of five hyphens leaves one
 * behind at the seam.
 */
function encode(payload: Record<string, unknown>) {
  return JSON.stringify(payload).replace(/-(?=-)/g, '\\u002d');
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
  // Both or neither: a name with no id to compare against buys nothing, and a
  // backend whose poster IS the editor records neither.
  const identity =
    note.authorId && note.author ? { author: note.author, authorId: note.authorId } : {};

  const marker = encode({ resolved: note.resolved, ...identity });

  return `${MARKER_PREFIX}${marker}${MARKER_SUFFIX}\n${note.content}`;
}

/**
 * The marker is hand-editable on the host, so nothing in it is trusted to be
 * the type it should be. A non-string author reaching `Note` crashes the pane
 * outright - the avatar initials call `.split()` on it - so anything that is
 * not a usable string is treated as no recorded author, which falls back to
 * the account that posted the comment.
 */
function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function parseNoteBody(body: string): ParsedNoteBody {
  const match = body.match(NOTE_PATTERN);

  if (!match) {
    const legacy = body.match(LEGACY_NOTE_PATTERN);
    if (legacy) {
      return { content: legacy[2].trim(), resolved: legacy[1] === 'RESOLVED' };
    }

    // A comment typed straight into the thread on the host. It is still a note,
    // just an unresolved one with no recorded author.
    return { content: body.trim(), resolved: false };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(match[1]);
  } catch {
    // Someone edited the marker by hand into something unparseable. Treat the
    // whole comment as content rather than dropping the note.
    return { content: body.trim(), resolved: false };
  }

  const author = asString(payload.author);
  const authorId = asString(payload.authorId);

  // Both or neither, as formatNoteBody writes them.
  const identity = author && authorId ? { author, authorId } : {};

  return {
    content: match[2].trim(),
    resolved: payload.resolved === true,
    author: identity.author,
    authorId: identity.authorId,
  };
}
