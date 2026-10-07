import React, { createContext, useContext, useMemo } from 'react';

import { getSlots } from './registry';

import type {
  CmsCollections,
  CmsCollectionState,
  CmsEntry,
  CmsSortDirection,
  CmsViewFilter,
  CmsViewGroup,
} from '@/lib/util/index';

/**
 * Render-slot extension surface for deep CMS components.
 *
 * Top-level layout slots (header, layout, auth page, dashboard root) flow
 * through `AppContentProps` as direct props. But components nested inside
 * the router — Collection, Editor, MediaLibrary — can't be customized via
 * props without invasive prop drilling. This context is the alternative:
 * an app shell supplies a `CmsSlots` object once at the
 * `AppContent` boundary, and any descendant component can read its own
 * slot via `useCmsSlots()`.
 *
 * **Adding a new slot** — add a typed field here (`renderEditorToolbar`,
 * `renderMediaLibrary`, …) plus its render-props interface. The consuming
 * component reads `useCmsSlots()`, branches on whether the slot is set,
 * and falls back to the default rendering when omitted. Default Decap CMS
 * behavior is preserved because the context default is an empty object.
 */

export interface CollectionTopRenderProps {
  collection: CmsCollectionState;
  newEntryUrl?: string;
  /** Current nested-collection tree path ('' or undefined at the root). */
  filterTerm?: string;
  userScopes?: string[];
}

export interface CollectionSidebarRenderProps {
  collections: CmsCollections;
  collection?: CmsCollectionState | undefined;
  isSearchEnabled?: boolean;
  searchTerm?: string;
  filterTerm?: string;
  userScopes?: string[];
}

export interface CollectionControlsRenderProps {
  viewStyle: string;
  onChangeViewStyle: (style: string) => void;
  sortableFields: { key: string, label?: string }[];
  onSortClick: (key: string, direction: CmsSortDirection) => void;
  sort?: Record<string, unknown> | undefined;
  viewFilters?: CmsViewFilter[] | undefined;
  viewGroups?: CmsViewGroup[] | undefined;
  onFilterClick: (filter: CmsViewFilter) => void;
  onGroupClick: (group: CmsViewGroup) => void;
  filter?: Record<string, unknown> | undefined;
  group?: Record<string, unknown> | undefined;
  /** Current free-text entry search query, lifted from `Collection`. */
  searchQuery?: string;
  /** Omit to hide the search field entirely (e.g. no searchable entries). */
  onSearchChange?: (query: string) => void;
}

export interface LoaderRenderProps {
  /**
   * Human-readable loading label, already i18n-translated. May be a single
   * string or an array that the default Loader rotates through.
   */
  label?: React.ReactNode;
  /** Where the loader is being shown — useful for picking layout/spacing. */
  context?: 'config' | 'entries' | 'entry' | 'workflow';
}

export interface EntryListEmptyRenderProps {
  /**
   * The collection being browsed, when the listing is scoped to one.
   * `undefined` for cross-collection search results pages.
   */
  collection?: CmsCollectionState | undefined;
}

export interface EntryCardRenderProps {
  collection: CmsCollectionState;
  entry: CmsEntry;
  inferredFields: { imageField?: string | null | undefined, [key: string]: unknown };
  collectionLabel?: string | false;
  viewStyle?: string | undefined;
  workflowStatus?: string | null | undefined;
}

export interface EditorToolbarRenderProps {
  isPersisting?: boolean | undefined;
  isPublishing?: boolean | undefined;
  isUpdatingStatus?: boolean | undefined;
  isDeleting?: boolean | undefined;
  onPersist: (opts?: { createNew?: boolean, duplicate?: boolean }) => void;
  onPersistAndNew: () => void;
  onPersistAndDuplicate: () => void;
  showDelete: boolean;
  onDelete: () => void;
  onDeleteUnpublishedChanges: () => void;
  onChangeStatus: (newStatus: string) => void;
  onPublish: (opts?: { createNew?: boolean, duplicate?: boolean }) => void;
  onSchedulePublish?: (() => void) | undefined;
  onCancelSchedulePublish?: (() => void) | undefined;
  scheduledPublishAt?: string | undefined;
  unPublish: () => void;
  onDuplicate: () => void;
  onPublishAndNew: () => void;
  onPublishAndDuplicate: () => void;
  // Not `CmsUser` (which requires auth `token`/credentials): the toolbar
  // only reads this for display (name/avatar), and `EditorInterface` passes
  // the looser display-only shape it receives as its own `user` prop.
  user?: { login?: string, name?: string, avatar_url?: string, [key: string]: unknown } | undefined;
  hasChanged?: boolean | undefined;
  displayUrl?: string | undefined;
  collection: CmsCollectionState;
  hasWorkflow?: boolean | undefined;
  useOpenAuthoring?: boolean | undefined;
  hasUnpublishedChanges?: boolean | undefined;
  isNewEntry?: boolean | undefined;
  isModification?: boolean | undefined;
  currentStatus?: string | undefined;
  onLogoutClick: () => void;
  deployPreview?:
    | { url?: string | undefined, status?: string | undefined, isFetching?: boolean | undefined }
    | undefined;
  loadDeployPreview: (opts?: { maxAttempts?: number, signal?: AbortSignal }) => void;
  editorBackLink: string;
}

export interface EditorViewControlsRenderProps {
  i18nEnabled: boolean;
  i18nVisible: boolean;
  onToggleI18n: () => void;
  previewEnabled: boolean;
  previewVisible: boolean;
  onTogglePreview: () => void;
  /** The notes pane (decaporg #7563): offered for saved entries under the editorial workflow. */
  notesEnabled: boolean;
  notesVisible: boolean;
  onToggleNotes: () => void;
  scrollSyncEnabled: boolean;
  scrollSyncVisible: boolean;
  onToggleScrollSync: () => void;
}

export interface MediaLibraryTopRenderProps {
  onClose: () => void;
  privateUpload?: boolean | undefined;
  forImage?: boolean | undefined;
  onDownload: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  query?: string | undefined;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  searchDisabled: boolean;
  onDelete: () => void;
  canInsert?: boolean | undefined;
  onInsert: () => void;
  hasSelection: boolean;
  isPersisting?: boolean | undefined;
  isDeleting?: boolean | undefined;
  selectedFile?: { path: string, draft: boolean, name: string } | Record<string, never> | undefined;
}

export interface MediaLibraryCardRenderProps {
  isSelected?: boolean;
  displayURL: Record<string, unknown>;
  text: string;
  onClick: () => void;
  draftText: string;
  width: string;
  height: string;
  margin: string;
  isPrivate?: boolean | undefined;
  type?: string;
  size?: number | undefined;
  isViewableImage: boolean;
  loadDisplayURL: () => void;
  isDraft?: boolean | undefined;
}

export interface WorkflowCardRenderProps {
  collectionLabel: string;
  title?: string | undefined;
  authorLastChange?: string;
  body?: string;
  isModification?: boolean;
  editLink: string;
  timestamp: string;
  onDelete: () => void;
  canDelete: boolean;
  allowPublish: boolean;
  canPublish: boolean;
  onPublish: () => void;
  postAuthor?: string;
}

export interface EditorPanelRenderProps {
  collection: CmsCollectionState;
  entry: CmsEntry;
  /** Locale being edited, for collections with i18n enabled. */
  locale?: string | undefined;
  /** Closes the drawer, e.g. after the panel completes an action. */
  onClose: () => void;
}

/**
 * A panel docked beside the entry form. Unlike the render slots below, panels
 * are *additive*: several can be installed and the editor shows them as tabs,
 * so two extensions do not fight over one region.
 */
export interface EditorPanel {
  /** Unique; also the tab's React key. */
  id: string;
  /** Tab label, and the toggle's label when this is the only panel. */
  label: string;
  /** Hide the panel for entries it does not apply to. */
  isAvailable?: (props: { collection: CmsCollectionState, entry: CmsEntry }) => boolean;
  render: (props: EditorPanelRenderProps) => React.ReactNode;
}

export interface CmsSlots {
  /**
   * Panels docked beside the entry form, rendered in a drawer. Additive: the
   * array from `CmsSlotsProvider` and any panels installed with
   * `CMS.registerPanel` are concatenated (app-supplied first) rather than one
   * replacing the other. With none, the editor renders exactly as before.
   */
  editorPanels?: EditorPanel[];
  /**
   * Replace the heading + "new entry" button rendered above a collection's
   * entry listing. Receives the collection and optional new-entry URL.
   */
  renderCollectionTop?: (props: CollectionTopRenderProps) => React.ReactNode;
  /**
   * Replace (or suppress) the per-page collection sidebar — the left rail
   * inside a collection's entry listing that shows the collection list +
   * in-collection search. Return `null` to suppress entirely (useful when
   * the app-level layout already supplies a sidebar via `renderLayout`).
   * When the slot returns `null`, the main pane reflows to fill the row.
   */
  renderCollectionSidebar?: (props: CollectionSidebarRenderProps) => React.ReactNode;
  /**
   * Replace the view-style / sort / filter / group toolbar rendered above
   * a collection's entry listing. The handlers and current state are
   * pre-resolved so the renderer stays presentational.
   */
  renderCollectionControls?: (props: CollectionControlsRenderProps) => React.ReactNode;
  /**
   * Replace the entry-card visual used in collection listings. Receives the
   * fully resolved entry data — collection, entry, inferred image field,
   * the active view style (list / grid), and the workflow status when the
   * editorial workflow is enabled.
   */
  renderEntryCard?: (props: EntryCardRenderProps) => React.ReactNode;
  /**
   * Render a zero-state placeholder when an entry listing has no entries.
   * Omit to keep the default empty `<CardsGrid>`. Fires only when the cards
   * array is fully resolved and empty — not during loading.
   */
  renderEntryListEmpty?: (props: EntryListEmptyRenderProps) => React.ReactNode;
  /**
   * Replace the generic `<Loader>` shown while collection entries, an
   * individual entry, or the workflow board is loading. Receives the
   * already-translated label and a `context` hint identifying where the
   * loader is being shown. Omit to keep the default `<Loader>`.
   */
  renderLoader?: (props: LoaderRenderProps) => React.ReactNode;
  /**
   * Replace the editorial-workflow card visual on the Workflow board.
   * Receives the same props as the default `WorkflowCard` — title, body,
   * author, edit link, publish/delete handlers — so consumers can re-skin
   * without re-implementing drag-and-drop or Redux integration.
   */
  renderWorkflowCard?: (props: WorkflowCardRenderProps) => React.ReactNode;
  /**
   * Replace the editor screen's top toolbar — the bar with save/publish/
   * delete actions above an entry's edit form. The full prop bundle is
   * pre-resolved so the renderer stays presentational and Redux-free.
   */
  renderEditorToolbar?: (props: EditorToolbarRenderProps) => React.ReactNode;
  /**
   * Replace the floating view-controls cluster inside the editor (the
   * pinned toggles for i18n, preview pane, and scroll-sync). Each toggle
   * comes in as `<feature>Enabled` (should it render at all) +
   * `<feature>Visible` (is it currently active) + the click handler.
   */
  renderEditorViewControls?: (props: EditorViewControlsRenderProps) => React.ReactNode;
  /**
   * Replace each card in the MediaLibrary grid (the modal that opens when
   * picking an image/file from a widget). Receives the file's display URL,
   * display name, selection state, click handler, and lazy display-URL
   * loader — so consumers can re-skin without re-implementing async asset
   * loading or selection wiring.
   */
  renderMediaLibraryCard?: (props: MediaLibraryCardRenderProps) => React.ReactNode;
  /**
   * Replace the top header of the MediaLibrary modal (title, search box,
   * upload / download / delete / insert buttons). Receives all click and
   * search-input handlers pre-resolved.
   */
  renderMediaLibraryTop?: (props: MediaLibraryTopRenderProps) => React.ReactNode;
}

const EMPTY_SLOTS: CmsSlots = {};

const CmsSlotsContext = createContext<CmsSlots>(EMPTY_SLOTS);

export interface CmsSlotsProviderProps {
  slots?: CmsSlots | undefined;
  children?: React.ReactNode;
}

export function CmsSlotsProvider({ slots, children }: CmsSlotsProviderProps) {
  return <CmsSlotsContext.Provider value={slots ?? EMPTY_SLOTS}>{children}</CmsSlotsContext.Provider>;
}

/**
 * Reads the slot renderers in effect. Two sources are merged:
 *
 *  1. Slots registered by an installed package (`CMS.registerSlot`), so an
 *     extension can contribute UI without the host app wiring it through.
 *  2. Slots supplied by the host app via `CmsSlotsProvider`.
 *
 * The app wins on conflict: a deployment must always be able to override what
 * one of its dependencies renders.
 */
export function useCmsSlots(): CmsSlots {
  const appSlots = useContext(CmsSlotsContext);
  const registeredSlots = getSlots();

  return useMemo(
    () => {
      if (Object.keys(registeredSlots).length === 0) return appSlots;

      const merged: CmsSlots = { ...registeredSlots, ...appSlots };
      // `editorPanels` is additive rather than replace-only: two sources of
      // panels should both show up as tabs, not silently shadow each other.
      // App-supplied panels come first so the deployment controls the order.
      const panels = [...(appSlots.editorPanels ?? []), ...(registeredSlots.editorPanels ?? [])];
      if (panels.length > 0) {
        merged.editorPanels = panels;
      }
      return merged;
    },
    // `registeredSlots` is a fresh object each render; registration happens at
    // boot, so its identity is not a useful dependency. Key off the slot names
    // actually present instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appSlots, Object.keys(registeredSlots).join(',')],
  );
}
