import React, { useEffect, useRef } from 'react';

import NotFoundPage from '@/core/components/NotFoundPage';
import { useEditor } from '@/core/hooks/useEditor';
import { useCmsSlots } from '@/core/lib/slots';
import { useLocation } from '@/core/routing/context';
import { Loader } from '@/ui/default/index';
import EditorInterface from './EditorInterface';

interface EditorProps {
  newRecord?: boolean;
  /** Collection the edited entry belongs to. Supplied by the route switch. */
  collectionName: string;
  /** Entry slug; omitted for a new entry. Supplied by the route switch. */
  slug?: string;
  /**
   * Custom not-found renderer threaded down from `AppContent`/`AppRoutes`
   * (the same prop `CollectionGuard` uses). Used in place of the default
   * `NotFoundPage` when the entry fails to load (DCMS-445) — this route
   * bypasses the app-shell chrome entirely otherwise, dead-ending the user
   * with no way back to the collection list.
   */
  renderNotFound?: (() => React.ReactNode) | undefined;
}

function Editor({ newRecord = false, collectionName, slug, renderNotFound }: EditorProps) {
  const { renderLoader } = useCmsSlots();
  const location = useLocation();
  const newEntry = newRecord === true;

  // Track previous values for update logic
  const prevLocalBackupRef = useRef<unknown>(undefined);
  const prevEntryRef = useRef<unknown>(undefined);
  // Tracks the edit session (`editKey`) the local-backup-recovery prompt has
  // already fired for, and the last `editKey` `setup()` ran against — see
  // the guards in the two effects below (DCMS-655).
  const backupPromptedKeyRef = useRef<string | null>(null);
  const lastEditKeyRef = useRef<string | null>(null);

  const editor = useEditor({
    collectionName,
    slug,
    newEntry,
    locationSearch: location.search,
    locationPathname: location.pathname,
  });

  const {
    collection,
    entry,
    entryDraft,
    fields,
    user,
    hasChanged,
    canCreateNewEntry,
    notesEnabled,
    notes,
    handleNotesChange,
    displayUrl,
    hasWorkflow,
    useOpenAuthoring,
    isModification,
    currentStatus,
    scheduledPublishAt,
    deployPreview,
    localBackup,
    draftKey,
    editorBackLink,
    unpublishedEntry,
    showDelete,
    setup,
    handleLocalBackupCheck,
    handleBackupOnChange,
    handleEntryChange,
    handleChangeDraftField,
    handleChangeStatus,
    handlePersistEntry,
    handlePublishEntry,
    handleSchedulePublish,
    handleCancelSchedulePublish,
    handleUnpublishEntry,
    handleDuplicateEntry,
    handleDeleteEntry,
    handleDeleteUnpublishedChanges,
    handleLogout,
    handleLoadDeployPreview,
    handleValidate,
    t,
  } = editor;

  // Setup on mount and teardown on unmount (replaces componentDidMount /
  // componentWillUnmount). Side effects must run in an effect, not during
  // render: `setup()` dispatches Redux actions, and dispatching while
  // rendering triggers React's "cannot update a component while rendering a
  // different component" warning (the store update reaches subscribed parents
  // like AppContent mid-render).
  //
  // Keyed on the edited-entry identity rather than `setup`'s identity: `setup`
  // is a useCallback whose deps include `entryDraft`, so it changes on every
  // keystroke — depending on it would re-run history.block()/loadEntries on
  // every edit. We want the once-per-entry semantics of the old lifecycle.
  const editKey = `${collectionName}/${slug ?? ''}/${newEntry}`;
  useEffect(() => {
    if (!collection) return;
    // Only reset the "already prompted for local backup" guard when this is
    // genuinely a different edit session than the last one `setup()` ran
    // for — not on every invocation of this effect. That distinction
    // matters because `setup()` can be invoked twice in a row for the *same*
    // `editKey` (React 18 StrictMode double-invokes mount effects, and this
    // app renders under `StrictMode` — see `app/index.ts`), with its
    // cleanup dispatching `discardDraft()` in between. See the comment on
    // the local-backup effect below for why that matters.
    if (lastEditKeyRef.current !== editKey) {
      lastEditKeyRef.current = editKey;
      backupPromptedKeyRef.current = null;
    }
    const result = setup();
    return result.cleanup;
    // Intentionally keyed on `editKey` only, not `setup`/`collection`: see the
    // comment above for why depending on `setup`'s identity would break the
    // once-per-entry semantics this effect relies on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editKey]);

  // Handle local backup check (replaces componentDidUpdate for localBackup).
  //
  // Guarded on `editKey` via `backupPromptedKeyRef`, not just the
  // previous-value ref-diff: `setup()`'s mount effect above can run twice
  // for the same edit session (React 18 StrictMode double-invoke), and its
  // cleanup dispatches `discardDraft()`, which resets the whole
  // `entryDraft` — including `localBackup` — back to its initial
  // `undefined` value in between the two invocations. Each invocation's
  // `retrieveLocalBackup` dispatch then resolves asynchronously and sets
  // `localBackup` again, so it crosses the `undefined -> backup` edge
  // *twice* for one logical edit session. A guard that only remembers the
  // immediately preceding value can't tell those two edges apart, so it
  // fired `window.confirm` (and could run the mismatched-answer
  // `deleteBackup()`) on both — silently discarding the just-restored draft
  // if the user answered differently the second time (DCMS-655). Once
  // we've prompted for a given `editKey`, later `undefined -> backup` edges
  // within that same session are re-dispatch noise and are skipped.
  useEffect(() => {
    if (prevLocalBackupRef.current !== localBackup) {
      const prevLocalBackup = prevLocalBackupRef.current;
      prevLocalBackupRef.current = localBackup;

      if (!prevLocalBackup && localBackup) {
        if (backupPromptedKeyRef.current === editKey) return;
        backupPromptedKeyRef.current = editKey;
      }

      handleLocalBackupCheck(prevLocalBackup);
    }
  }, [localBackup, handleLocalBackupCheck, editKey]);

  // Handle backup on change (replaces componentDidUpdate for hasChanged)
  useEffect(() => {
    handleBackupOnChange();
  }, [handleBackupOnChange]);

  // Handle entry change (replaces componentDidUpdate for entry)
  useEffect(() => {
    if (prevEntryRef.current !== entry) {
      handleEntryChange(prevEntryRef.current);
      prevEntryRef.current = entry;
    }
  }, [entry, handleEntryChange]);

  const isPublished = !newEntry && !unpublishedEntry;

  // Render the failed-load state. This route mounts under the fullscreen
  // editor layout (which hides the app-shell top-nav, expecting
  // `EditorInterface`'s own header instead — see `isEditorRouteKey` in
  // `App.tsx`), so without this the user is left with zero app chrome and no
  // in-app way back to the collection list (DCMS-445).
  if (entry && (entry as any).error) {
    return renderNotFound ? <>{renderNotFound()}</> : (
      <NotFoundPage
        message={(entry as any).error}
        backLink={{ to: editorBackLink, label: collection?.label ?? collectionName }}
      />
    );
  }

  if (
    entryDraft == null
    || (entryDraft as any).entry === undefined
    || (entry && (entry as any).isFetching)
  ) {
    return renderLoader
      ? <>{renderLoader({ label: t('editor.editor.loadingEntry'), context: 'entry' })}</>
      : <Loader active>{t('editor.editor.loadingEntry')}</Loader>;
  }

  return (
    <EditorInterface
      draftKey={draftKey || ''}
      entry={entryDraft.entry}
      collection={collection!}
      fields={fields!}
      fieldsMetaData={entryDraft.fieldsMetaData as any}
      fieldsErrors={entryDraft.fieldsErrors as any}
      onChange={handleChangeDraftField}
      onValidate={handleValidate}
      onPersist={handlePersistEntry}
      onDelete={handleDeleteEntry}
      onDeleteUnpublishedChanges={handleDeleteUnpublishedChanges}
      onChangeStatus={handleChangeStatus}
      onPublish={handlePublishEntry}
      onSchedulePublish={handleSchedulePublish}
      onCancelSchedulePublish={handleCancelSchedulePublish}
      scheduledPublishAt={scheduledPublishAt}
      unPublish={handleUnpublishEntry}
      onDuplicate={handleDuplicateEntry}
      showDelete={showDelete ?? false}
      user={user}
      hasChanged={hasChanged ?? false}
      canCreateNewEntry={canCreateNewEntry}
      displayUrl={displayUrl}
      hasWorkflow={hasWorkflow ?? false}
      useOpenAuthoring={useOpenAuthoring ?? false}
      hasUnpublishedChanges={unpublishedEntry}
      isNewEntry={newEntry}
      isModification={isModification ?? false}
      currentStatus={currentStatus}
      onLogoutClick={handleLogout}
      deployPreview={deployPreview}
      loadDeployPreview={handleLoadDeployPreview}
      editorBackLink={editorBackLink}
      notesEnabled={notesEnabled}
      notes={notes}
      onNotesChange={handleNotesChange}
      t={t}
    />
  );
}

export default Editor;
