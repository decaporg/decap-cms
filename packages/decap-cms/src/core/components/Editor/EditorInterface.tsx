import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import React from 'react';
import { Pane, SplitPane } from 'react-split-pane';

import { FILES } from '@/core/constants/collectionTypes';
import { getI18nInfo, getPreviewEntry, hasI18n } from '@/core/lib/i18n';
import { useCmsSlots } from '@/core/lib/slots';
import { getFileFromSlug, selectEntryCollectionTitle } from '@/core/reducers/collections';
import { ScrollSync, ScrollSyncPane } from '@/ui';
import { colors, colorsRaw, components, IconButton, transitions, zIndex } from '@/ui/default/index';
import EditorControlPane, { type ControlPaneHandle } from './EditorControlPane/EditorControlPane';
import EditorFieldNavigator, { flattenNavigableFields } from './EditorFieldNavigator/EditorFieldNavigator';
import EditorPanels from './EditorPanels';
import EditorPreviewPane from './EditorPreviewPane/EditorPreviewPane';
import EditorToolbar from './EditorToolbar';
import EntryLockBanner from './EntryLockBanner';

import type { I18nInfo } from '@/core/lib/i18n';
import type { CmsCollectionState, CmsEntry, CmsEntryField } from '@/lib/util/index';
import type { TranslateFunction } from '@/ui/default/index';
import type { ReactNode } from 'react';

type Collection = CmsCollectionState;
type EntryMap = CmsEntry;
type EntryField = CmsEntryField;

const PREVIEW_VISIBLE = 'cms.preview-visible';
const SCROLL_SYNC_ENABLED = 'cms.scroll-sync-enabled';
const SPLIT_PANE_POSITION = 'cms.split-pane-position';
const I18N_VISIBLE = 'cms.i18n-visible';
const FIELD_NAVIGATOR_VISIBLE = 'cms.field-navigator-visible';

// Below this width the side-by-side split leaves each pane too narrow to use
// (DCMS-642); stack the panes vertically instead so each gets the full
// viewport width.
const NARROW_SPLIT_PANE_QUERY = '(max-width: 800px)';

function supportsMatchMedia() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function useIsNarrowSplitPaneViewport() {
  const [isNarrow, setIsNarrow] = React.useState(
    () => supportsMatchMedia() && window.matchMedia(NARROW_SPLIT_PANE_QUERY).matches,
  );

  React.useEffect(() => {
    if (!supportsMatchMedia()) return;
    const mediaQueryList = window.matchMedia(NARROW_SPLIT_PANE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsNarrow(event.matches);
    setIsNarrow(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, []);

  return isNarrow;
}

const styles = {
  splitPane: css`
    ${components.card};
    border-radius: 0;
    height: 100%;
  `,
  pane: css`
    height: 100%;
    overflow-y: auto;
  `,
};

const EditorToggle = styled(IconButton)`
  margin-bottom: 12px;
`;

function ReactSplitPaneGlobalStyles() {
  return (
    <Global
      styles={css`
        .Resizer.vertical {
          width: 2px;
          cursor: col-resize;
          position: relative;
          background: none;

          &:before {
            content: '';
            width: 2px;
            height: 100%;
            position: relative;
            background-color: ${colors.textFieldBorder};
            display: block;
            z-index: 10;
            transition: background-color ${transitions.main};
          }

          &:hover,
          &:active {
            &:before {
              width: 4px;
              left: -1px;
              background-color: ${colorsRaw.blue};
            }
          }
        }
      `}
    />
  );
}

const StyledSplitPane = styled(SplitPane)`
  ${styles.splitPane};

  /**
   * Quick fix for preview pane not fully displaying in Safari
   */
  .Pane {
    height: 100%;
  }
`;

const NoPreviewContainer = styled.div`
  ${styles.splitPane};
`;

// Wrapper between `Editor` and the split pane. Must be full-height: the split
// pane and its panes are `height: 100%`, so without a definite-height parent
// the percentage collapses and the preview pane (Pane2), whose only content is
// the ~150px-intrinsic iframe, shrinks instead of filling the editor.
const SplitPaneWrapper = styled.div`
  height: 100%;
`;

// `EditorInterface` only ever renders on the two editor routes (`entryNew` /
// `entry` — see `isEditorRouteKey` in `App.tsx`), where the app-shell header
// is unmounted (DCMS-431), so there is no app chrome to offset. The editor
// toolbar (default or slot-provided) is laid out in flow as the first flex
// child, so `Editor` starts below it at whatever height that toolbar has —
// no hardcoded offset (DCMS-440 removed a stale `padding-top: 66px`).
const EditorContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: ${colors.background};
`;

const Editor = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;

const EditorLayout = styled.div`
  display: flex;
  height: 100%;
`;

const FieldNavigatorContainer = styled.div`
  width: 240px;
  min-width: 240px;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid ${colors.textFieldBorder};
`;

const EditorContentContainer = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
`;

// Screen-reader-only page title. The toolbar's `<BackCollection>` already
// shows "Writing in %{collectionLabel} collection" visually, so a redesign
// isn't warranted here (DCMS-1370) — this just gives every entry-editor
// route the `<h1>` that WCAG 2.4.6 and screen-reader `H`-key navigation
// require, without touching the existing visible chrome.
const PageTitle = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// Entry-editor page title (DCMS-1370): reuses `selectEntryCollectionTitle`
// (same title logic as entry cards / workflow list) so folder-collection
// entries get their title field, files-collection entries get the file's
// `label`, and everything else falls back to a collection-scoped default.
function getEditorPageTitle(
  t: TranslateFunction,
  collection: Collection,
  entry: EntryMap,
  isNewEntry?: boolean,
) {
  if (isNewEntry) {
    return t('editor.editorInterface.newEntryTitle', { collectionLabel: collection.label });
  }
  const title = selectEntryCollectionTitle(collection, entry);
  return title || t('editor.editorInterface.untitledEntryTitle', { collectionLabel: collection.label });
}

interface PreviewPaneContainerProps {
  $blockEntry?: boolean;
  $overFlow?: boolean;
}

const PreviewPaneContainer = styled.div<PreviewPaneContainerProps>`
  height: 100%;
  pointer-events: ${(props: PreviewPaneContainerProps) => (props.$blockEntry ? 'none' : 'auto')};
  overflow-y: ${(props: PreviewPaneContainerProps) => (props.$overFlow ? 'auto' : 'hidden')};
`;

const ControlPaneContainer = styled(PreviewPaneContainer)`
  padding: 0 16px;
  position: relative;
  overflow-x: hidden;
`;

const ViewControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: ${zIndex.zIndex299};
`;

interface EditorContentProps {
  i18nVisible: boolean;
  previewVisible: boolean;
  editor: ReactNode;
  editorWithEditor: ReactNode;
  editorWithPreview: ReactNode;
}

function EditorContent({
  i18nVisible,
  previewVisible,
  editor,
  editorWithEditor,
  editorWithPreview,
}: EditorContentProps) {
  if (i18nVisible) {
    return editorWithEditor;
  } else if (previewVisible) {
    return editorWithPreview;
  } else {
    return <NoPreviewContainer>{editor}</NoPreviewContainer>;
  }
}

/**
 * What counts as a keyboard landing spot inside the control pane, for the
 * initial-focus and focus-restore behavior below.
 */
const FOCUSABLE_FIELD_SELECTOR = 'input:not([type="hidden"]), textarea, select, [contenteditable="true"]';

/**
 * Walks a `[data-field-name]` element up through its `[data-field-name]`
 * ancestors (object-widget nesting renders one wrapper per nested field, see
 * EditorControl) and joins the names into the same dotted path
 * `buildFieldPath`/the field navigator and `ControlPaneHandle.focus(path)`
 * use, so scroll/focus tracking can match a DOM node back to a nav entry.
 */
function getFieldPathFromElement(fieldElement: HTMLElement, container: HTMLElement): string {
  const names: string[] = [];
  let current: HTMLElement | null = fieldElement;
  while (current && container.contains(current)) {
    const name = current.getAttribute('data-field-name');
    if (name) names.unshift(name);
    const parent: HTMLElement | null = current.parentElement;
    current = parent?.closest<HTMLElement>('[data-field-name]') ?? null;
  }
  return names.join('.');
}

function isPreviewEnabled(collection: Collection, entry: EntryMap) {
  if (collection.type === FILES) {
    const file = getFileFromSlug(collection, entry.slug);
    const previewEnabled = (file as any)?.editor?.preview;
    if (previewEnabled != null) return previewEnabled;
  }
  return (collection as any).editor?.preview ?? true;
}

interface EditorInterfaceProps {
  collection: Collection;
  entry: EntryMap;
  fields: EntryField[];
  fieldsMetaData: Record<string, Record<string, unknown>>;
  fieldsErrors: Record<string, { type: string, message: string }[]>;
  onChange: (field: EntryField, value: unknown, metadata?: unknown, i18n?: unknown) => void;
  onValidate: (fieldName: string, errors: { type: string, message: string }[]) => void;
  onPersist: (opts?: { createNew?: boolean, duplicate?: boolean }) => void;
  showDelete: boolean;
  onDelete: () => void;
  onDeleteUnpublishedChanges: () => void;
  onPublish: (opts?: { createNew?: boolean, duplicate?: boolean }) => void;
  onSchedulePublish?: (() => void) | undefined;
  onCancelSchedulePublish?: (() => void) | undefined;
  scheduledPublishAt?: string | undefined;
  unPublish: () => void;
  onDuplicate: () => void;
  onChangeStatus: (newStatus: string) => void;
  user?: { login?: string, name?: string, avatar_url?: string, [key: string]: unknown };
  hasChanged?: boolean;
  /** Whether a new entry can be created in this collection (`create` plus any `limit`). */
  canCreateNewEntry?: boolean;
  displayUrl?: string;
  hasWorkflow?: boolean;
  useOpenAuthoring?: boolean;
  hasUnpublishedChanges?: boolean;
  isNewEntry?: boolean;
  isModification?: boolean;
  currentStatus?: string | undefined;
  onLogoutClick: () => void;
  deployPreview?: { url?: string | undefined, status?: string | undefined, [key: string]: unknown };
  loadDeployPreview: (...args: unknown[]) => void;
  draftKey: string;
  t: TranslateFunction;
  editorBackLink?: string;
}

type ControlPaneRef = ControlPaneHandle;

function EditorInterface(props: EditorInterfaceProps) {
  const { renderEditorToolbar, renderEditorViewControls } = useCmsSlots();
  const {
    collection,
    entry,
    fields,
    fieldsMetaData,
    fieldsErrors,
    onChange,
    onPersist,
    showDelete,
    onDelete,
    onDeleteUnpublishedChanges,
    onChangeStatus,
    onPublish,
    onSchedulePublish,
    onCancelSchedulePublish,
    scheduledPublishAt,
    unPublish,
    onDuplicate,
    onValidate,
    user,
    hasChanged,
    canCreateNewEntry,
    displayUrl,
    hasWorkflow,
    useOpenAuthoring,
    hasUnpublishedChanges,
    isNewEntry,
    isModification,
    currentStatus,
    onLogoutClick,
    loadDeployPreview,
    deployPreview,
    draftKey,
    editorBackLink,
    t,
  } = props;

  const controlPaneRef = React.useRef<ControlPaneRef | null>(null);
  const editorBodyRef = React.useRef<HTMLDivElement | null>(null);
  // DCMS-2134: `viewControlsRef` + `assistantToggleRect` track the two
  // floating overlays (the field-navigator/i18n/preview/scroll-sync icon
  // row and the collapsed AI-assistant pill) that sit absolutely positioned
  // in the top-right corner of `Editor`. Both were previously invisible to
  // layout — they painted on top of whatever the preview iframe rendered
  // there, clipping the last few characters of any preview content that
  // wrapped into that corner (e.g. a long entry title's `<h1>`). Measuring
  // their real footprint here lets the preview reserve that space instead.
  const viewControlsRef = React.useRef<HTMLDivElement | null>(null);
  const [assistantToggleRect, setAssistantToggleRect] = React.useState<DOMRect | null>(null);
  const [previewChromeReserve, setPreviewChromeReserve] = React.useState({ width: 0, height: 0 });
  // Which field (and which focusable within it) last held focus. Lives here,
  // OUTSIDE the `key={draftKey}` subtree, so it survives the remount that a
  // save triggers (persist success re-creates the draft with a new key).
  const lastFocusedFieldRef = React.useRef<{ name: string, index: number } | null>(null);
  const [showEventBlocker, setShowEventBlocker] = React.useState(false);
  const [previewVisible, setPreviewVisible] = React.useState(
    () => localStorage.getItem(PREVIEW_VISIBLE) !== 'false',
  );
  const [scrollSyncEnabled, setScrollSyncEnabled] = React.useState(
    () => localStorage.getItem(SCROLL_SYNC_ENABLED) !== 'false',
  );
  const [i18nVisibleState, setI18nVisibleState] = React.useState(
    () => localStorage.getItem(I18N_VISIBLE) !== 'false',
  );
  const [fieldNavigatorVisible, setFieldNavigatorVisible] = React.useState(
    () => localStorage.getItem(FIELD_NAVIGATOR_VISIBLE) === 'true',
  );
  // Which top-level (dotted-path for nested object fields) field is
  // currently "current" for the field navigator's highlight state — kept in
  // sync both by focus (see handleEditorBodyFocus) and by scroll (see the
  // effect below), matching deliverable #2 of DCMS-1423's field navigator.
  const [activeFieldPath, setActiveFieldPath] = React.useState<string | undefined>(undefined);
  const controlPaneScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [leftPanelLocaleState, setLeftPanelLocale] = React.useState<string | undefined>(undefined);
  const isNarrowSplitPaneViewport = useIsNarrowSplitPaneViewport();
  const splitPaneDirection = isNarrowSplitPaneViewport ? 'vertical' : 'horizontal';

  function handleFieldClick(path: string) {
    controlPaneRef.current?.focus(path);
    setActiveFieldPath(path);
  }

  // Remember where focus is whenever it lands inside the editor body, keyed
  // by the field's `data-field-name` wrapper (set in EditorControl) plus the
  // focusable's position within that field.
  function handleEditorBodyFocus(event: React.FocusEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const wrapper = target.closest?.('[data-field-name]');
    if (!wrapper) return;
    const focusables = Array.from(wrapper.querySelectorAll<HTMLElement>(FOCUSABLE_FIELD_SELECTOR));
    lastFocusedFieldRef.current = {
      name: wrapper.getAttribute('data-field-name') ?? '',
      index: Math.max(0, focusables.indexOf(target)),
    };
    setActiveFieldPath(getFieldPathFromElement(wrapper as HTMLElement, event.currentTarget));
  }

  // Keyboard focus across the editor body's lifecycle: on first mount (e.g.
  // arriving via the 'n' shortcut) put focus in the first field so Tab works
  // immediately; when a save remounts the `key={draftKey}` subtree and drops
  // focus on <body>, put it back where it was. Never steal focus that
  // survived elsewhere (e.g. on the toolbar's Save button after a click).
  React.useEffect(() => {
    const container = editorBodyRef.current;
    if (!container) return undefined;

    // Returns true when this run is settled: either focus was placed, or
    // someone else (toolbar button after a click, the user) holds focus and
    // must not be robbed. Returns false while the fields aren't there yet.
    function tryFocus(): boolean {
      if (!container) return true;
      const active = document.activeElement;
      if (active && active !== document.body && !container.contains(active)) return true;
      const remembered = lastFocusedFieldRef.current;
      let target: HTMLElement | null = null;
      if (remembered) {
        const wrapper = container.querySelector(`[data-field-name="${CSS.escape(remembered.name)}"]`);
        if (wrapper) {
          const focusables = Array.from(wrapper.querySelectorAll<HTMLElement>(FOCUSABLE_FIELD_SELECTOR));
          target = focusables[Math.min(remembered.index, focusables.length - 1)] ?? null;
        }
      }
      target ??= container.querySelector<HTMLElement>(FOCUSABLE_FIELD_SELECTOR);
      target?.focus();
      return target !== null;
    }

    // The control pane's fields render whenever the entry/draft is ready —
    // immediately for a new entry, seconds later for a slow backend fetch.
    // Try once after the commit paints, then let a MutationObserver catch
    // the moment the fields actually appear.
    let observer: MutationObserver | null = null;
    const frame = requestAnimationFrame(() => {
      if (tryFocus()) return;
      observer = new MutationObserver(() => {
        if (tryFocus()) {
          observer?.disconnect();
          observer = null;
        }
      });
      observer.observe(container, { childList: true, subtree: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [draftKey]);

  function handleSplitPaneResizeStart() {
    setShowEventBlocker(true);
  }

  function handleSplitPaneResizeEnd(sizes: number[]) {
    setShowEventBlocker(false);
    localStorage.setItem(SPLIT_PANE_POSITION, String(sizes[0]));
  }

  // WCAG 2.1 3.3.1 (Error Identification): after a failed Save/Publish,
  // `validate()` flags invalid widgets with `aria-invalid="true"` (see
  // EditorControl/leaf widget controls), but nothing moves focus there.
  // Wait a frame for the resulting re-render to paint the attribute, then
  // focus the first invalid control so screen-reader users land on it
  // immediately instead of only hearing the "missed a required field" toast.
  function focusFirstInvalidFieldSoon() {
    requestAnimationFrame(() => {
      const container = editorBodyRef.current;
      if (!container) return;
      const invalidControl = container.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (invalidControl) {
        invalidControl.focus();
        return;
      }
      // Fallback (DCMS-1086): a widget control that forgot to (or can't)
      // announce its own `aria-invalid` still renders EditorControl's
      // `<ul id="<field>-errors">`. Focus the nearest tabbable
      // ancestor/descendant of the first rendered error list instead of
      // silently leaving focus on the Save button.
      const errorList = container.querySelector<HTMLElement>('[id$="-errors"]');
      if (!errorList) return;
      const fieldWrapper = errorList.closest<HTMLElement>('[data-field-name]') ?? errorList.parentElement;
      fieldWrapper
        ?.querySelector<HTMLElement>('input, textarea, select, button, [tabindex], [contenteditable="true"]')
        ?.focus();
    });
  }

  async function handleOnPersist(opts: { createNew?: boolean, duplicate?: boolean } = {}) {
    const { createNew = false, duplicate = false } = opts;
    await controlPaneRef.current?.switchToDefaultLocale();
    controlPaneRef.current?.validate();
    focusFirstInvalidFieldSoon();
    onPersist({ createNew, duplicate });
  }

  async function handleOnPublish(opts: { createNew?: boolean, duplicate?: boolean } = {}) {
    const { createNew = false, duplicate = false } = opts;
    await controlPaneRef.current?.switchToDefaultLocale();
    controlPaneRef.current?.validate();
    focusFirstInvalidFieldSoon();
    onPublish({ createNew, duplicate });
  }

  function handleTogglePreview() {
    setPreviewVisible(prev => {
      const next = !prev;
      localStorage.setItem(PREVIEW_VISIBLE, String(next));
      return next;
    });
  }

  function handleToggleScrollSync() {
    setScrollSyncEnabled(prev => {
      const next = !prev;
      localStorage.setItem(SCROLL_SYNC_ENABLED, String(next));
      return next;
    });
  }

  function handleToggleI18n() {
    setI18nVisibleState(prev => {
      const next = !prev;
      localStorage.setItem(I18N_VISIBLE, String(next));
      return next;
    });
  }

  function handleToggleFieldNavigator() {
    setFieldNavigatorVisible(prev => {
      const next = !prev;
      localStorage.setItem(FIELD_NAVIGATOR_VISIBLE, String(next));
      return next;
    });
  }

  // Highlight-current-field state (deliverable #2): while the navigator is
  // open, track which navigable field's control is nearest the top of the
  // scrollable control pane and mark it active, so the panel's selection
  // follows the user scrolling through the form (not just clicking a nav
  // item or focusing a control, which `handleFieldClick`/
  // `handleEditorBodyFocus` already cover).
  React.useEffect(() => {
    if (!fieldNavigatorVisible) return undefined;
    const container = controlPaneScrollRef.current;
    if (!container) return undefined;

    const navigablePaths = new Set(flattenNavigableFields(fields as EntryField[]).map(f => f.path));

    function updateActiveField() {
      if (!container) return;
      const fieldElements = Array.from(container.querySelectorAll<HTMLElement>('[data-field-name]'));
      const containerTop = container.getBoundingClientRect().top;
      let closestPath: string | undefined;
      let closestDistance = Infinity;
      for (const el of fieldElements) {
        const path = getFieldPathFromElement(el, container);
        if (!navigablePaths.has(path)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < containerTop) continue;
        const distance = Math.abs(rect.top - containerTop);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPath = path;
        }
      }
      if (closestPath) setActiveFieldPath(closestPath);
    }

    let frame = requestAnimationFrame(updateActiveField);
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveField);
    }
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', onScroll);
    };
  }, [fieldNavigatorVisible, fields]);

  const previewEnabled = isPreviewEnabled(collection, entry);

  const i18nInfo = getI18nInfo(collection) as I18nInfo;
  const locales = i18nInfo.locales || [];
  const defaultLocale = i18nInfo.defaultLocale || '';
  const collectionI18nEnabled = hasI18n(collection) && locales.length > 1;
  const editorProps = {
    collection,
    entry,
    fields,
    fieldsMetaData,
    fieldsErrors,
    onChange,
    onValidate,
  };

  const leftPanelLocale = leftPanelLocaleState || locales?.[0];
  const editor = (
    <ControlPaneContainer $overFlow $blockEntry={showEventBlocker} ref={controlPaneScrollRef}>
      <EditorControlPane
        {...editorProps}
        ref={(c: ControlPaneRef | null) => {
          controlPaneRef.current = c;
        }}
        locale={leftPanelLocale}
        t={t}
        onLocaleChange={setLeftPanelLocale}
      />
    </ControlPaneContainer>
  );

  const editor2 = (
    <ControlPaneContainer $overFlow={!scrollSyncEnabled} $blockEntry={showEventBlocker}>
      <EditorControlPane {...editorProps} locale={locales?.[1]} t={t} />
    </ControlPaneContainer>
  );

  const previewEntry = collectionI18nEnabled
    ? getPreviewEntry(entry, leftPanelLocale, defaultLocale)
    : entry;

  const editorWithPreview = (
    <ScrollSync enabled={scrollSyncEnabled}>
      <SplitPaneWrapper>
        <ReactSplitPaneGlobalStyles />
        <StyledSplitPane
          direction={splitPaneDirection}
          onResizeStart={handleSplitPaneResizeStart}
          onResizeEnd={handleSplitPaneResizeEnd}
        >
          <Pane
            className="Pane1"
            maxSize={-100}
            minSize={400}
            defaultSize={parseInt(localStorage.getItem(SPLIT_PANE_POSITION) || '0', 10) || '50%'}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
          </Pane>
          <Pane className="Pane2">
            <PreviewPaneContainer $blockEntry={showEventBlocker}>
              <EditorPreviewPane
                collection={collection}
                entry={previewEntry}
                fields={fields}
                fieldsMetaData={fieldsMetaData}
                locale={leftPanelLocale}
                onFieldClick={handleFieldClick}
                previewChromeReserve={previewChromeReserve}
              />
            </PreviewPaneContainer>
          </Pane>
        </StyledSplitPane>
      </SplitPaneWrapper>
    </ScrollSync>
  );

  const editorWithEditor = (
    <ScrollSync enabled={scrollSyncEnabled}>
      <SplitPaneWrapper>
        <StyledSplitPane
          direction={splitPaneDirection}
          onResizeStart={handleSplitPaneResizeStart}
          onResizeEnd={handleSplitPaneResizeEnd}
        >
          <Pane
            className="Pane1"
            maxSize={-100}
            defaultSize={parseInt(localStorage.getItem(SPLIT_PANE_POSITION) || '0', 10) || '50%'}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
          </Pane>
          <Pane className="Pane2">
            <ScrollSyncPane>{editor2}</ScrollSyncPane>
          </Pane>
        </StyledSplitPane>
      </SplitPaneWrapper>
    </ScrollSync>
  );

  const i18nVisible = collectionI18nEnabled && i18nVisibleState;
  const previewVisibleResolved = previewEnabled && previewVisible;
  const scrollSyncVisible = i18nVisible || previewVisibleResolved;

  // DCMS-2134: recompute the union of the view-controls icon row and the
  // (separately measured) assistant pill, expressed as the space to reserve
  // from the preview's top-right corner, whenever either overlay's contents
  // or the layout that positions them changes.
  React.useLayoutEffect(() => {
    const editorRect = editorBodyRef.current?.getBoundingClientRect();
    if (!editorRect) return;
    const rects: (DOMRect | null)[] = [
      viewControlsRef.current?.getBoundingClientRect() ?? null,
      assistantToggleRect,
    ];
    let width = 0;
    let height = 0;
    for (const rect of rects) {
      if (!rect || (rect.width === 0 && rect.height === 0)) continue;
      width = Math.max(width, editorRect.right - rect.left);
      height = Math.max(height, rect.bottom - editorRect.top);
    }
    setPreviewChromeReserve(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, [
    assistantToggleRect,
    fieldNavigatorVisible,
    collectionI18nEnabled,
    previewEnabled,
    scrollSyncVisible,
    previewVisibleResolved,
  ]);

  const toolbarProps = {
    isPersisting: entry.isPersisting,
    isPublishing: (entry as any).isPublishing,
    isUpdatingStatus: (entry as any).isUpdatingStatus,
    isDeleting: (entry as any).isDeleting,
    onPersist: handleOnPersist,
    onPersistAndNew: () => handleOnPersist({ createNew: true }),
    onPersistAndDuplicate: () => handleOnPersist({ createNew: true, duplicate: true }),
    onDelete,
    onDeleteUnpublishedChanges,
    onChangeStatus,
    showDelete,
    onPublish,
    onSchedulePublish,
    onCancelSchedulePublish,
    scheduledPublishAt,
    unPublish,
    onDuplicate,
    onPublishAndNew: () => handleOnPublish({ createNew: true }),
    onPublishAndDuplicate: () => handleOnPublish({ createNew: true, duplicate: true }),
    user,
    hasChanged,
    canCreateNewEntry,
    displayUrl,
    collection,
    hasWorkflow,
    useOpenAuthoring,
    hasUnpublishedChanges,
    isNewEntry,
    isModification,
    currentStatus,
    onLogoutClick,
    loadDeployPreview,
    deployPreview,
    editorBackLink: editorBackLink || '',
  };

  return (
    <EditorContainer>
      <PageTitle>{getEditorPageTitle(t, collection, entry, isNewEntry)}</PageTitle>
      {!isNewEntry && entry.slug && <EntryLockBanner collection={collection} slug={entry.slug} />}
      {renderEditorToolbar
        ? renderEditorToolbar(toolbarProps)
        : React.createElement(EditorToolbar as any, { ...toolbarProps, t })}
      <Editor key={draftKey} ref={editorBodyRef} onFocus={handleEditorBodyFocus}>
        {(() => {
          const viewControlsProps = {
            i18nEnabled: !!collectionI18nEnabled,
            i18nVisible: !!i18nVisible,
            onToggleI18n: handleToggleI18n,
            previewEnabled: !!previewEnabled,
            previewVisible: !!previewVisibleResolved,
            onTogglePreview: handleTogglePreview,
            scrollSyncEnabled: !!scrollSyncEnabled,
            scrollSyncVisible: !!scrollSyncVisible && !(collection as any).editor?.visualEditing,
            onToggleScrollSync: handleToggleScrollSync,
          };
          if (renderEditorViewControls) {
            return renderEditorViewControls(viewControlsProps);
          }
          return (
            <ViewControls ref={viewControlsRef}>
              <EditorToggle
                isActive={fieldNavigatorVisible}
                isToggle
                onClick={handleToggleFieldNavigator}
                size="large"
                type="list-bulleted"
                title={t('editor.editorInterface.toggleFieldNavigator')}
              />
              {collectionI18nEnabled && (
                <EditorToggle
                  isActive={i18nVisible}
                  isToggle
                  onClick={handleToggleI18n}
                  size="large"
                  type="page"
                  title={t('editor.editorInterface.toggleI18n')}
                />
              )}
              {previewEnabled && (
                <EditorToggle
                  isActive={previewVisibleResolved}
                  isToggle
                  onClick={handleTogglePreview}
                  size="large"
                  type="eye"
                  title={t('editor.editorInterface.togglePreview')}
                />
              )}
              {scrollSyncVisible && !(collection as any).editor?.visualEditing && (
                <EditorToggle
                  isActive={scrollSyncEnabled}
                  isToggle
                  onClick={handleToggleScrollSync}
                  size="large"
                  type="scroll"
                  title={t('editor.editorInterface.toggleScrollSync')}
                />
              )}
            </ViewControls>
          );
        })()}
        <EditorLayout>
          {fieldNavigatorVisible && (
            <FieldNavigatorContainer>
              <EditorFieldNavigator
                fields={fields as EntryField[]}
                activeFieldPath={activeFieldPath}
                onFieldClick={handleFieldClick}
                t={t}
              />
            </FieldNavigatorContainer>
          )}
          <EditorContentContainer>
            <EditorContent
              i18nVisible={!!i18nVisible}
              previewVisible={!!previewVisibleResolved}
              editor={editor}
              editorWithEditor={editorWithEditor}
              editorWithPreview={editorWithPreview}
            />
          </EditorContentContainer>
        </EditorLayout>
        <EditorPanels
          panelProps={{
            collection,
            entry,
            ...(leftPanelLocale ? { locale: leftPanelLocale } : {}),
          }}
          t={t}
          onToggleRectChange={setAssistantToggleRect}
        />
      </Editor>
    </EditorContainer>
  );
}

export default EditorInterface;
