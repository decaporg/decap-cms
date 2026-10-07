/**
 * `decap-cms/lib/backend`: everything needed to write a backend.
 *
 * The seam types are defined here; the config/collection types the contract
 * references and the implementer helpers are re-exported from `lib/util` for
 * self-containment, so an implementation imports this module and nothing else.
 * Moving those definitions here physically is tracked debt (see README).
 */

export { assertNeverContent, parsedContent, rawContent } from './content';
export type { BackendEntryContent, ParsedContent, RawContent } from './content';

export type { BackendEntry, BackendEntryFile, BackendFileRef, UnpublishedEntry, UnpublishedEntryDiff } from './entry';

// The one domain type the seam carries: who authored a revision.
export type { Author } from '@/lib/domain/index';
export type { Asset, DataFile, MediaFile, PersistPayload } from './persist';

export type { AuthComponent, BackendClass, BackendImplementation } from './implementation';

// Editor notes: the seam types plus the shared comment encoding and polling.
export type {
  ChangeType,
  CommentData,
  IssueChange,
  IssueChangeData,
  IssueState,
  Note,
  NotesWatchCallbacks,
} from './notes';
export { notesConfigured } from './notes';
export { commentsToNotes, commentToNote, formatNoteBody, markOwnNotes, parseNoteBody } from './notesFormat';
export type { ParsedNoteBody } from './notesFormat';
export { NotesPollingManager } from './notesPolling';
export type { NotesPollingAPI } from './notesPolling';

// -- Config and collection types the contract references ---------------------

export type {
  CmsAuthScope as AuthScope,
  CmsBackend as BackendConfig,
  CmsBackendInitConfig as BackendInitConfig,
  CmsBackendType as BackendType,
  CmsCollection as Collection,
  CmsCollectionFile as CollectionFile,
  CmsConfig as Config,
  CmsCredentials as Credentials,
  CmsDeleteOptions as DeleteOptions,
  CmsDisplayURL as DisplayURL,
  CmsEntryLock as EntryLock,
  CmsEntryLockOwner as EntryLockOwner,
  CmsGetMediaPageOptions as GetMediaPageOptions,
  CmsMediaCapabilities as MediaCapabilities,
  CmsMediaPage as MediaPage,
  CmsPersistOptions as PersistOptions,
  CmsUser as User,
} from '@/lib/util/index';

// -- Implementer helpers -----------------------------------------------------

// Listing and reading entries/media on top of a plain fetch surface.
export {
  allEntriesByFolder,
  blobToFileObj,
  entriesByFiles,
  entriesByFolder,
  filterByExtension,
  getBlobSHA,
  getMediaAsBlob,
  getMediaDisplayURL,
  readFile,
  readFileMetadata,
  runWithLock,
  unpublishedEntries,
} from '@/lib/util/index';

// HTTP plumbing: request building, retry/backoff, pagination, errors.
export {
  APIError,
  getAllResponses,
  parseLinkHeader,
  parseResponse,
  requestWithBackoff,
  responseParser,
  unsentRequest,
} from '@/lib/util/index';
export type { ApiRequest, FetchError } from '@/lib/util/index';

// Paging cursor handed back to the engine from `traverseCursor`.
export { Cursor, CURSOR_COMPATIBILITY_SYMBOL } from '@/lib/util/index';

// Editorial-workflow branch/label conventions shared by the git backends.
export {
  branchFromContentKey,
  CMS_BRANCH_PREFIX,
  contentKeyFromBranch,
  DEFAULT_PR_BODY,
  EditorialWorkflowError,
  generateContentKey,
  getPreviewStatus,
  isCMSLabel,
  labelToStatus,
  MERGE_COMMIT_MESSAGE,
  parseContentKey,
  PreviewState,
  statusToLabel,
  throwOnConflictingBranches,
} from '@/lib/util/index';

// Advisory entry locking: a local reference implementation to delegate to.
export {
  createAnonymousLockOwnerId,
  createInMemoryEntryLockStore,
  createLocalStorageEntryLockStore,
  DEFAULT_ENTRY_LOCK_TTL_MS,
  EntryLockConflictError,
  EntryLockManager,
} from '@/lib/util/index';
export type { EntryLockStore } from '@/lib/util/index';

// Concurrency and storage primitives.
export { asyncLock, createSemaphore, localForage } from '@/lib/util/index';
export type { AsyncLock, Semaphore } from '@/lib/util/index';

// Auth errors backends throw for the app to render.
export { AccessTokenError, ConfigurationError } from '@/lib/util/index';

// Path helpers, used for media folders and entry paths.
export { basename, dirname, extname, isAbsolutePath, join } from '@/lib/util/index';
