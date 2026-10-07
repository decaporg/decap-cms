import type Cursor from '@/lib/util/Cursor';
import type {
  CmsConfig,
  CmsCredentials,
  CmsDisplayURL,
  CmsEntryLock,
  CmsEntryLockOwner,
  CmsGetMediaPageOptions,
  CmsMediaCapabilities,
  CmsMediaPage,
  CmsPersistOptions,
  CmsUser,
} from '@/lib/util/index';
import type { BackendEntry, BackendFileRef, UnpublishedEntry } from './entry';
import type { Note, NotesWatchCallbacks } from './notes';
import type { Asset, MediaFile, PersistPayload } from './persist';

/**
 * Structural stand-in for `React.ComponentType<any>`: this module is a
 * published dependency-free layer and must not import `react`, but every
 * real implementation's `authComponent()` returns a function or class
 * component (see backends/*\/implementation.ts*), never `void`. Props stay
 * open because the engine picks the prop set it renders the auth page with.
 */
export type AuthComponent = ((props: any) => any) | (new(props: any) => any);

/**
 * What a backend implementation must provide. Instantiated by the engine
 * through `registerBackend(name, BackendClass)`, and the only backend
 * contract there is: entries cross the seam as {@link BackendEntry} with a
 * tagged `content` union, authorship is a structured `Author`, display labels
 * come from collection config rather than the backend, and the persist
 * payload is {@link PersistPayload}.
 */
export interface BackendImplementation {
  authComponent: () => AuthComponent;
  restoreUser: (user: CmsUser) => Promise<CmsUser>;

  authenticate: (credentials: CmsCredentials) => Promise<CmsUser>;
  logout: () => Promise<void> | void | null;
  getToken: () => Promise<string | null>;

  /**
   * Proactively refresh credentials so they are valid *now* (optional).
   * Called when the user plausibly returns from being away (tab becomes
   * visible, network comes back, periodic check) so the next action doesn't
   * run into an expired token. Resolve without a network call when the
   * current credentials are still fresh, and report an unrecoverably dead
   * session through `onSessionExpired` rather than by rejecting.
   */
  ensureFreshSession?: () => Promise<void>;

  /**
   * `useWorkflow` is an optional hint for implementations that probe both
   * published and unpublished storage: when `false`, the caller knows the
   * collection has no editorial workflow, so an unpublished-only lookup can
   * be skipped. Implementations that don't distinguish published from
   * unpublished storage may ignore it.
   */
  getEntry: (path: string, useWorkflow?: boolean) => Promise<BackendEntry>;
  entriesByFolder: (folder: string, extension: string, depth: number) => Promise<BackendEntry[]>;
  entriesByFiles: (files: BackendFileRef[]) => Promise<BackendEntry[]>;

  getMediaDisplayURL?: (displayURL: CmsDisplayURL) => Promise<string>;
  /**
   * `folderSupport` asks the backend to also return directory entries
   * (`isDirectory: true`) alongside files, when it can do so from the listing
   * call it would make anyway. Backends that can't populate directories
   * cheaply may ignore the flag and return files only; callers must not
   * assume directories are present.
   */
  getMedia: (folder?: string, folderSupport?: boolean) => Promise<MediaFile[]>;
  getMediaFile: (path: string) => Promise<MediaFile>;

  /**
   * Paginated media surface (optional). Implementing both methods lets the
   * media library load pages on demand instead of fetching the whole library
   * up front. `getMedia` stays required: the per-entry media-folder path
   * still uses it.
   */
  getMediaCapabilities?: () => Promise<CmsMediaCapabilities>;
  /**
   * Fetch one page of media. `cursor` is the opaque continuation from the
   * previous page (omit for the first). `query` is only passed when
   * `getMediaCapabilities().dynamicSearch` is true, and is applied
   * server-side. A missing `nextCursor` means the listing is exhausted.
   */
  getMediaPage?: (opts: CmsGetMediaPageOptions) => Promise<CmsMediaPage>;

  persistEntry: (payload: PersistPayload, opts: CmsPersistOptions) => Promise<void>;
  persistMedia: (file: Asset, opts: CmsPersistOptions) => Promise<MediaFile>;
  deleteFiles: (paths: string[], commitMessage: string) => Promise<void>;

  unpublishedEntries: () => Promise<string[]>;
  unpublishedEntry: (args: {
    id?: string | undefined,
    collection?: string | undefined,
    slug?: string | undefined,
  }) => Promise<UnpublishedEntry>;
  unpublishedEntryDataFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<string>;
  unpublishedEntryMediaFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<MediaFile>;
  updateUnpublishedEntryStatus: (
    collection: string,
    slug: string,
    newStatus: string,
  ) => Promise<void>;
  publishUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  deleteUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  getDeployPreview: (
    collectionName: string,
    slug: string,
  ) => Promise<{ url: string, status: string } | null>;

  allEntriesByFolder?: (
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
  ) => Promise<BackendEntry[]>;
  traverseCursor?: (
    cursor: Cursor,
    action: string,
  ) => Promise<{ entries: BackendEntry[], cursor: Cursor }>;

  isGitBackend?: () => boolean;
  status: () => Promise<{
    auth: { status: boolean },
    api: { status: boolean, statusPage: string },
  }>;

  /**
   * Content-sync surface (optional). A sync token is an opaque string that
   * changes whenever any content changes (git: branch head sha; database:
   * sequence number), enabling background change detection without content
   * reads.
   */
  getSyncToken?: () => Promise<string | null>;
  /**
   * Lists content changes since a previously returned sync token, as
   * repo-relative paths, plus the token to poll from next. Optional even when
   * `getSyncToken` exists; without it a token change invalidates coarsely
   * instead of per path.
   */
  getChanges?: (
    since: string,
  ) => Promise<{ changes: { path: string, deleted: boolean }[], token: string } | null>;

  /**
   * Advisory entry locking (optional capability). A backend declares support
   * by implementing all four methods below; the engine feature-detects via
   * `acquireEntryLock`. `EntryLockManager` (re-exported from this module) is a
   * reusable local/in-memory implementation to delegate to.
   *
   * Locks are advisory: nothing here blocks a write, it only lets the UI warn
   * a user before they clobber a concurrent edit.
   */
  getEntryLock?: (path: string) => Promise<CmsEntryLock | null>;
  /**
   * Acquire (or renew) the lock for `path` under `owner`. Succeeds when the
   * path is unlocked, already held by `owner`, or `opts.force` is set (an
   * explicit user override). Rejects when held by a different, non-expired
   * owner without `opts.force`.
   */
  acquireEntryLock?: (
    path: string,
    owner: CmsEntryLockOwner,
    opts?: { force?: boolean },
  ) => Promise<CmsEntryLock | null>;
  /**
   * Release the lock for `path`, but only if currently held by `owner`: a
   * release from a stale tab that lost a force-override race must not evict
   * the new holder.
   */
  releaseEntryLock?: (path: string, owner: CmsEntryLockOwner) => Promise<void>;
  /**
   * Extend the lock's TTL. Called periodically by the editor while an entry
   * stays open, so a long editing session doesn't go stale mid-edit.
   */
  refreshEntryLock?: (path: string, owner: CmsEntryLockOwner) => Promise<CmsEntryLock | null>;

  /**
   * Editor notes (optional capability; decaporg #7563): comments on an entry
   * under the editorial workflow, shown in the editor's notes pane. A backend
   * declares support by implementing `getNotes` and the mutations below. The
   * `notesFormat` helpers re-exported from this module encode a note as a
   * host comment the same way across backends.
   */
  getNotes?: (collection: string, slug: string) => Promise<Note[]>;
  /** `entryTitle` names the thread a backend creates for the entry's first note. */
  addNote?: (collection: string, slug: string, note: Omit<Note, 'id'>, entryTitle?: string) => Promise<Note>;
  updateNote?: (collection: string, slug: string, noteId: string, updates: Partial<Note>) => Promise<Note>;
  deleteNote?: (collection: string, slug: string, noteId: string) => Promise<void>;
  toggleNoteResolution?: (collection: string, slug: string, noteId: string) => Promise<Note>;
  /**
   * Keep the open entry's notes current (optional): watch its thread and call
   * back when it changes. `NotesPollingManager` (re-exported from this module)
   * implements the watching on top of a small per-host API.
   */
  startNotesPolling?: (collection: string, slug: string, callbacks: NotesWatchCallbacks) => Promise<void>;
  stopNotesPolling?: (collection: string, slug: string) => Promise<void>;
  refreshNotesNow?: (collection: string, slug: string) => Promise<void>;
  /**
   * Reopen an entry's notes thread after the entry is unpublished (it was
   * closed on publish), so notes can continue on the new unpublished entry.
   */
  reopenIssueForUnpublishedEntry?: (collection: string, slug: string) => Promise<void>;
}

/**
 * The constructor `registerBackend(name, BackendClass)` expects: instantiated
 * by the engine with the resolved config and any extra options.
 */
export type BackendClass = new(
  config: CmsConfig,
  opts?: Record<string, unknown>,
) => BackendImplementation;
