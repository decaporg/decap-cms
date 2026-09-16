/**
 * Notes on the GitLab backend.
 *
 * An entry's notes live in a GitLab issue of their own, one comment per note —
 * the same shape the GitHub backend uses, so a repository's notes read the same
 * whichever host holds them. The body encoding is shared (`formatNoteBody` /
 * `parseNoteBody` in lib-util); what lives here is GitLab's REST surface and
 * the handful of places it differs from GitHub's.
 *
 * Three differences worth knowing:
 *
 * - GitLab calls a comment a "note", which is not Decap's note. In this file
 *   `comment` always means GitLab's note and `note` always means Decap's.
 * - A comment id is scoped to its issue, not to the project, so every mutation
 *   needs the issue's iid as well as the comment id. GitHub's ids are global
 *   and its methods take only the id.
 * - GitLab posts its own comments — "changed the description", "closed" — as
 *   comments with `system: true`. They are not notes and are filtered out.
 */
import { APIError, formatNoteBody, parseNoteBody } from 'decap-cms-lib-util';

import type { CommentData, IssueState, Note, NotesPollingAPI } from 'decap-cms-lib-util';

/** Writes send a JSON body rather than query parameters: a note's body is
 *  arbitrary markdown, and a long one does not belong in a URL. */
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export const NOTES_LABEL = 'decap-cms-notes';
export const NOTE_ISSUE_PREFIX = 'Notes: ';

/** Marks the issue as one of ours and records which entry it belongs to. The
 *  description is also what `findEntryIssue` searches, so the exact
 *  `collection/slug` string has to appear in it. */
export function noteIssueDescription(collectionName: string, slug: string) {
  return (
    `This issue tracks notes for entry: \`${collectionName}/${slug}\`\n\n---\n` +
    `*This issue was created automatically by Decap CMS for note management.*`
  );
}

export interface GitLabIssue {
  iid: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed';
  updated_at: string;
  labels: string[];
  web_url: string;
  user_notes_count?: number;
}

export interface GitLabComment {
  id: number;
  body: string;
  author: { username: string; name?: string; avatar_url?: string | null } | null;
  created_at: string;
  updated_at: string;
  system?: boolean;
}

/** GitLab says `opened`; the shared `IssueState` says `open`. */
function toIssueState(issue: GitLabIssue, comments: CommentData[]): IssueState {
  return {
    number: issue.iid,
    title: issue.title,
    body: issue.description ?? '',
    state: issue.state === 'closed' ? 'closed' : 'open',
    updated_at: issue.updated_at,
    comments,
    // The shared shape carries a colour GitLab does not return from this
    // endpoint; nothing reads it, and inventing one would be worse than blank.
    labels: (issue.labels ?? []).map(name => ({ name, color: '' })),
    html_url: issue.web_url,
  };
}

function toCommentData(comment: GitLabComment): CommentData {
  return {
    id: comment.id,
    body: comment.body,
    user: comment.author
      ? {
          login: comment.author.username,
          avatar_url: comment.author.avatar_url ?? '',
        }
      : null,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  };
}

/** The subset of the GitLab API client this needs, so it can be exercised
 *  without standing up the whole backend. */
export interface NotesRequester {
  repoURL: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestJSON: (req: any) => Promise<any>;
}

export class GitLabNotesAPI {
  private api: NotesRequester;

  constructor(api: NotesRequester) {
    this.api = api;
  }

  private get repoURL() {
    return this.api.repoURL;
  }

  parseCommentToNote(comment: CommentData): Note {
    if (!comment || !comment.body) {
      throw new Error('Invalid comment structure');
    }

    const { content, resolved, author, authorId } = parseNoteBody(comment.body);

    if (!content) {
      throw new Error('Empty note content');
    }

    return {
      id: comment.id.toString(),
      // Falls back to the account that posted, which is right for a comment
      // typed on GitLab and for notes predating the recorded author.
      author: author || comment.user?.login || 'Unknown',
      authorId,
      // Only when the posting account IS the note's author — a recorded author
      // means someone posted on their behalf, and its avatar would mislabel the
      // note. The pane shows initials instead.
      avatarUrl: authorId ? undefined : comment.user?.avatar_url || undefined,
      timestamp: comment.created_at,
      content,
      resolved,
      entrySlug: '',
    };
  }

  /**
   * The shared polling interface identifies a thread by `number`, which is
   * GitHub's word for it; GitLab's is `iid`, and the two are not
   * interchangeable with GitLab's other id (`id`, which is global rather than
   * project-scoped). Translating here rather than adding a synthetic `number`
   * to the issue type keeps the mismatch in one visible place.
   */
  asPollingAPI(): NotesPollingAPI {
    return {
      getIssueState: iid => this.getIssueState(iid),
      getIssueWithETag: (iid, etag) => this.getIssueWithETag(iid, etag),
      parseCommentToNote: comment => this.parseCommentToNote(comment),
      findEntryIssue: async (collection, slug) => {
        const issue = await this.findEntryIssue(collection, slug);
        return issue ? { number: issue.iid } : null;
      },
    };
  }

  async createEntryIssue(
    collectionName: string,
    slug: string,
    entryTitle?: string,
  ): Promise<GitLabIssue> {
    return this.api.requestJSON({
      url: `${this.repoURL}/issues`,
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        title: `${NOTE_ISSUE_PREFIX}${entryTitle || `${collectionName}/${slug}`}`,
        description: noteIssueDescription(collectionName, slug),
        labels: [NOTES_LABEL, `collection:${collectionName}`].join(','),
      }),
    });
  }

  /**
   * GitLab's issue list is already project-scoped, so this is a filter rather
   * than GitHub's global `search/issues` with a `repo:` qualifier — no
   * cross-project query to get wrong, and no search index to lag behind a
   * just-created issue.
   *
   * `search` is a substring match over the description, so it can in principle
   * match a longer slug that contains this one; the exact `collection/slug`
   * string is confirmed against the description before the issue is accepted.
   */
  async findEntryIssue(collectionName: string, slug: string): Promise<GitLabIssue | null> {
    try {
      const needle = `${collectionName}/${slug}`;
      const issues: GitLabIssue[] = await this.api.requestJSON({
        url: `${this.repoURL}/issues`,
        params: {
          labels: NOTES_LABEL,
          search: needle,
          in: 'description',
          per_page: 20,
        },
      });

      return issues.find(issue => (issue.description ?? '').includes(`\`${needle}\``)) ?? null;
    } catch (error) {
      console.warn('Failed to search for existing notes issue:', error);
      return null;
    }
  }

  private async getIssue(iid: number): Promise<GitLabIssue> {
    return this.api.requestJSON(`${this.repoURL}/issues/${iid}`);
  }

  private async getIssueComments(iid: number): Promise<CommentData[]> {
    try {
      const comments: GitLabComment[] = await this.api.requestJSON({
        url: `${this.repoURL}/issues/${iid}/notes`,
        params: { per_page: 100, sort: 'asc', order_by: 'created_at' },
      });

      return (
        (Array.isArray(comments) ? comments : [])
          // GitLab's own activity entries ("changed the description", "closed")
          // arrive on this endpoint too and are not notes.
          .filter(comment => !comment.system)
          .map(toCommentData)
      );
    } catch (error) {
      console.error('Failed to get issue comments:', error);
      return [];
    }
  }

  /**
   * Always a full read. GitLab does not offer a usable conditional request
   * here: it does not promise an ETag on issues, and `requestJSON` parses a
   * body that a 304 would not have. The signature keeps the ETag shape because
   * `NotesPollingAPI` is shared with backends that do support it — this one
   * simply always answers 200 with a null tag, and the polling manager still
   * reports a change only when the thread's contents actually differ. The cost
   * is two reads per poll instead of a cheap 304, not a wrong answer.
   */
  async getIssueWithETag(
    iid: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _etag: string | null,
  ): Promise<
    | { status: 304; data?: never; etag?: never }
    | { status: 200; data: IssueState; etag: string | null }
  > {
    const issue = await this.getIssue(iid);
    const comments = await this.getIssueComments(iid);

    return { status: 200, data: toIssueState(issue, comments), etag: null };
  }

  async getIssueState(iid: number): Promise<IssueState> {
    const response = await this.getIssueWithETag(iid, null);
    if (response.status === 200 && response.data) {
      return response.data;
    }
    throw new Error('Failed to get issue state');
  }

  async getEntryNotes(collectionName: string, slug: string): Promise<Note[]> {
    try {
      const issue = await this.findEntryIssue(collectionName, slug);
      if (!issue) {
        return [];
      }

      const comments = await this.getIssueComments(issue.iid);

      return comments.reduce<Note[]>((notes, comment) => {
        try {
          notes.push({ ...this.parseCommentToNote(comment), issueUrl: issue.web_url });
        } catch (error) {
          // An empty or malformed comment is not a note; skipping it keeps the
          // rest of the thread readable instead of failing the whole pane.
        }
        return notes;
      }, []);
    } catch (error) {
      console.error('Failed to get entry notes:', error);
      return [];
    }
  }

  async addNoteToEntry(
    collectionName: string,
    slug: string,
    note: Note,
    entryTitle?: string,
  ): Promise<{ commentId: string; issueUrl: string }> {
    try {
      const issue =
        (await this.findEntryIssue(collectionName, slug)) ??
        (await this.createEntryIssue(collectionName, slug, entryTitle));

      const comment: GitLabComment = await this.api.requestJSON({
        url: `${this.repoURL}/issues/${issue.iid}/notes`,
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ body: formatNoteBody(note) }),
      });

      return { commentId: comment.id.toString(), issueUrl: issue.web_url };
    } catch (error) {
      console.error('Failed to add note to entry:', error);
      throw new APIError('Failed to create note', error?.status || 500, 'GitLab');
    }
  }

  /** Takes the entry as well as the comment id: a GitLab comment id means
   *  nothing without the issue that holds it. */
  async updateEntryNote(
    collectionName: string,
    slug: string,
    noteId: string,
    note: Note,
  ): Promise<void> {
    const issue = await this.findEntryIssue(collectionName, slug);
    if (!issue) {
      throw new APIError('Failed to update note', 404, 'GitLab');
    }

    try {
      await this.api.requestJSON({
        url: `${this.repoURL}/issues/${issue.iid}/notes/${noteId}`,
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify({ body: formatNoteBody(note) }),
      });
    } catch (error) {
      console.error('Failed to update entry note:', error);
      throw new APIError('Failed to update note', error?.status || 500, 'GitLab');
    }
  }

  async deleteEntryNote(collectionName: string, slug: string, noteId: string): Promise<void> {
    const issue = await this.findEntryIssue(collectionName, slug);
    if (!issue) {
      throw new APIError('Failed to delete note', 404, 'GitLab');
    }

    try {
      await this.api.requestJSON({
        url: `${this.repoURL}/issues/${issue.iid}/notes/${noteId}`,
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete entry note:', error);
      throw new APIError('Failed to delete note', error?.status || 500, 'GitLab');
    }
  }

  /**
   * `state_event` is GitLab's way of moving an issue, and labels are replaced
   * wholesale rather than added, so the existing ones are carried across.
   */
  private async setIssueState(
    issue: GitLabIssue,
    stateEvent: 'close' | 'reopen',
    labels: string[],
  ) {
    await this.api.requestJSON({
      url: `${this.repoURL}/issues/${issue.iid}`,
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ state_event: stateEvent, labels: labels.join(',') }),
    });
  }

  async closeIssueOnPublish(collectionName: string, slug: string): Promise<void> {
    try {
      const issue = await this.findEntryIssue(collectionName, slug);
      if (!issue || issue.state === 'closed') {
        return;
      }
      await this.setIssueState(issue, 'close', [...(issue.labels ?? []), 'entry-published']);
    } catch (error) {
      console.warn('Failed to close notes issue on publish:', error);
    }
  }

  async reopenIssueOnUnpublish(collectionName: string, slug: string): Promise<void> {
    try {
      const issue = await this.findEntryIssue(collectionName, slug);
      if (!issue) {
        return;
      }
      const labels = (issue.labels ?? []).filter(
        label => label !== 'entry-published' && label !== 'entry-deleted',
      );
      await this.setIssueState(issue, 'reopen', labels);
    } catch (error) {
      console.warn('Failed to reopen notes issue on unpublish:', error);
    }
  }

  async closeEntryNotesIssue(collectionName: string, slug: string): Promise<void> {
    try {
      const issue = await this.findEntryIssue(collectionName, slug);
      if (!issue || issue.state === 'closed') {
        return;
      }
      await this.setIssueState(issue, 'close', [...(issue.labels ?? []), 'entry-deleted']);
    } catch (error) {
      console.warn('Failed to close notes issue:', error);
    }
  }
}
