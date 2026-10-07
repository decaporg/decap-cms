# `CmsSlots` render-slot extension API

`CmsSlots` is a React context (`packages/decap-cms/src/core/lib/slots.tsx`) that lets a host app —
any app embedding this package — replace individual, deeply nested pieces of the CMS UI without
prop-drilling or forking the component tree.

Top-level layout slots (header, layout, auth page, dashboard root) are already customizable via
direct props on `AppContentProps`. `CmsSlots` covers everything below that boundary: components
nested inside the collection/editor/media-library routes that a top-level prop can't reach.

## How it works

1. Supply a `CmsSlots` object once, at the app root, via `CmsSlotsProvider`.
2. Any descendant component calls `useCmsSlots()` and reads its own slot.
3. Slots are optional. A component that finds its slot `undefined` falls back to its default Decap
   CMS rendering — so omitting `CmsSlotsProvider` entirely, or omitting individual keys, changes
   nothing about default behavior.

```tsx
import { CmsSlotsProvider } from 'decap-cms/app';

function renderCollectionTop({ collection, newEntryUrl }) {
  return <MyCustomCollectionHeader collection={collection} newEntryUrl={newEntryUrl} />;
}

function renderLoader({ label, context }) {
  return <MySpinner label={label} data-context={context} />;
}

export function Root() {
  return (
    <CmsSlotsProvider slots={{ renderCollectionTop, renderLoader }}>
      <App />
    </CmsSlotsProvider>
  );
}
```

`CmsSlotsProvider` and `useCmsSlots` are re-exported publicly from both `app/components/index.ts`
and `app/index.ts`, so they're available from the package's top-level entry points.

Nesting `CmsSlotsProvider`s is supported: the nearest provider's `slots` object is what
`useCmsSlots()` resolves. It replaces the whole object rather than merging with an outer provider,
so a key omitted by the inner provider only inherits the outer value if the inner provider passes
that key through explicitly (or supplies the same value).

## Slot keys

Each entry below lists the slot, the component it replaces, and the file where it's consumed.

### `renderCollectionTop`

Replaces the heading + "new entry" button rendered above a collection's entry listing.

- Props: `CollectionTopRenderProps` (`collection`, `newEntryUrl?`, `filterTerm?`, `userScopes?`)
  - `filterTerm?`: current nested-collection tree path (`''` or `undefined` at the root).
  - `userScopes?`: authenticated user's scopes for custom affordance gating.
- Consumer: `packages/decap-cms/src/core/components/Collection/Collection.tsx:77`

### `renderCollectionSidebar`

Replaces the per-page collection sidebar — the left rail inside a collection's entry listing that
shows the collection list and in-collection search. Return `null` to suppress it entirely (useful
when the app-level layout already supplies a sidebar via its own `renderLayout` prop); the main pane
reflows to fill the row when this slot returns `null`.

- Props: `CollectionSidebarRenderProps` (`collections`, `collection?`, `isSearchEnabled?`,
  `searchTerm?`, `filterTerm?`, `userScopes?`)
- Consumer: `packages/decap-cms/src/core/components/Collection/Collection.tsx:77`

### `renderCollectionControls`

Replaces the view-style / sort / filter / group toolbar rendered above a collection's entry listing.
Handlers and current state are pre-resolved, so the renderer stays presentational.

- Props: `CollectionControlsRenderProps` (`viewStyle`, `onChangeViewStyle`, `sortableFields`,
  `onSortClick`, `sort?`, `viewFilters?`, `viewGroups?`, `onFilterClick`, `onGroupClick`, `filter?`,
  `group?`, `searchQuery?`, `onSearchChange?`)
- Consumer: `packages/decap-cms/src/core/components/Collection/Collection.tsx:77`

### `renderEntryCard`

Replaces the entry-card visual used in collection listings. Receives fully resolved entry data —
collection, entry, inferred image field, active view style (list/grid), and workflow status when the
editorial workflow is enabled.

- Props: `EntryCardRenderProps` (`collection`, `entry`, `inferredFields`, `collectionLabel?`,
  `viewStyle?`, `workflowStatus?`)
- Consumer: `packages/decap-cms/src/core/components/Collection/Entries/EntryListing.tsx:105`

### `renderEntryListEmpty`

Renders a zero-state placeholder when an entry listing has no entries. Omit to keep the default
empty `<CardsGrid>`. Fires only once the cards array is fully resolved and empty — never during
loading.

- Props: `EntryListEmptyRenderProps` (`collection?`)
- Consumer: `packages/decap-cms/src/core/components/Collection/Entries/EntryListing.tsx:105`

### `renderLoader`

Replaces the generic `<Loader>` shown while collection entries, an individual entry, or the workflow
board is loading. Receives the already-translated label and a `context` hint identifying where the
loader is being shown. Omit to keep the default `<Loader>`.

- Props: `LoaderRenderProps` (`label?`, `context?: 'config' | 'entries' | 'entry' | 'workflow'`)
- Consumers:
  - `packages/decap-cms/src/core/components/Collection/Entries/Entries.tsx:55`
  - `packages/decap-cms/src/core/components/Workflow/Workflow.tsx:68`
  - `packages/decap-cms/src/core/components/Editor/Editor.tsx:27`

### `renderWorkflowCard`

Replaces the editorial-workflow card visual on the Workflow board. Receives the same data as the
default `WorkflowCard` — title, body, author, edit link, publish/delete handlers — so consumers can
re-skin it without re-implementing drag-and-drop or Redux integration.

- Props: `WorkflowCardRenderProps` (`collectionLabel`, `title?`, `authorLastChange?`, `body?`,
  `isModification?`, `editLink`, `timestamp`, `onDelete`, `canDelete`, `allowPublish`, `canPublish`,
  `onPublish`, `postAuthor?`)
- Consumer: `packages/decap-cms/src/core/components/Workflow/WorkflowList.tsx:232`

### `renderEditorToolbar`

Replaces the editor screen's top toolbar — the bar with save/publish/delete actions above an entry's
edit form. The full prop bundle is pre-resolved so the renderer stays presentational and Redux-free.

- Props: `EditorToolbarRenderProps` (persist/publish/delete state and handlers, `user?`,
  `hasChanged?`, `displayUrl?`, `collection`, `hasWorkflow?`, `useOpenAuthoring?`, and more — see
  the interface in `slots.tsx`)
- Consumer: `packages/decap-cms/src/core/components/Editor/EditorInterface.tsx:346`

### `renderEditorViewControls`

Replaces the floating view-controls cluster inside the editor — the pinned toggles for i18n, preview
pane, and scroll-sync. Each toggle arrives as `<feature>Enabled` (should it render at all),
`<feature>Visible` (is it currently active), and the click handler.

- Props: `EditorViewControlsRenderProps` (`i18nEnabled`, `i18nVisible`, `onToggleI18n`,
  `previewEnabled`, `previewVisible`, `onTogglePreview`, `notesEnabled`, `notesVisible`,
  `onToggleNotes`, `scrollSyncEnabled`, `scrollSyncVisible`, `onToggleScrollSync`). The i18n,
  notes and preview panes share one slot beside the fields, so at most one is visible.
- Consumer: `packages/decap-cms/src/core/components/Editor/EditorInterface.tsx:346`

### `renderMediaLibraryCard`

Replaces each card in the MediaLibrary grid — the modal that opens when picking an image/file from a
widget. Receives the file's display URL, display name, selection state, click handler, and a lazy
display-URL loader, so consumers can re-skin without re-implementing async asset loading or
selection wiring.

- Props: `MediaLibraryCardRenderProps` (`isSelected?`, `displayURL`, `text`, `onClick`, `draftText`,
  `width`, `height`, `margin`, `isPrivate?`, `type?`, `size?`, `isViewableImage`, `loadDisplayURL`,
  `isDraft?`)
- Consumer: `packages/decap-cms/src/core/components/MediaLibrary/MediaLibraryCardGrid.tsx:25`

### `renderMediaLibraryTop`

Replaces the top header of the MediaLibrary modal — title, search box, and upload/download/
delete/insert buttons. All click and search-input handlers are pre-resolved.

- Props: `MediaLibraryTopRenderProps` (`onClose`, `privateUpload?`, `forImage?`, `onDownload`,
  `onUpload`, `query?`, `onSearchChange`, `onSearchKeyDown`, `searchDisabled`, `onDelete`,
  `canInsert?`, `onInsert`, `hasSelection`, `isPersisting?`, `isDeleting?`, `selectedFile?`)
- Consumer: `packages/decap-cms/src/core/components/MediaLibrary/MediaLibraryModal.tsx:180`

### `editorPanels`

**Additive, unlike every slot above.** Panels are extra UI docked beside the entry form in a drawer,
and several can coexist: the array supplied here is concatenated with any panels installed through
`CMS.registerPanel` (app-supplied first) and shown as tabs, rather than one replacing the other.

With no panels installed the drawer renders nothing at all — no toggle and no DOM — so the editor is
byte-identical for a deployment that has none.

```tsx
<CmsSlotsProvider
  slots={{
    editorPanels: [
      {
        id: 'seo',
        label: 'SEO',
        isAvailable: ({ collection }) => collection.name === 'posts',
        render: ({ entry, onClose }) => <SeoPanel entry={entry} onClose={onClose} />,
      },
    ],
  }}
>
```

- Props: `EditorPanel[]`, each rendering with `EditorPanelRenderProps` (`collection`, `entry`,
  `locale?`, `onClose`)
- Consumer: `packages/decap-cms/src/core/components/Editor/EditorPanels.tsx:99`

## Adding a new slot

Add a typed field to the `CmsSlots` interface in `slots.tsx` (e.g. `renderMyThing`) plus its
render-props interface. The consuming component should call `useCmsSlots()`, branch on whether the
slot is set, and fall back to the default rendering when it's omitted — that keeps default Decap CMS
behavior unchanged for anyone who doesn't supply a `CmsSlotsProvider`. Add both a pinning test in
`src/core/lib/__tests__/slots.spec.tsx` and an entry in this doc for the new key.

A slot that should _accumulate_ rather than replace (like `editorPanels`) needs one extra step:
merge it explicitly in `useCmsSlots`, which otherwise lets the app-supplied value shadow the
registered one.

## Provider wiring

`CmsSlotsProvider` is mounted once at the app root, in `App.tsx`, wrapping the entire routed
content:

```tsx
// packages/decap-cms/src/app/components/App.tsx
<CmsSlotsProvider slots={slots}>{/* ...routed app content... */}</CmsSlotsProvider>;
```

Everything rendered below that point — collections, entries, the editor, the workflow board, and the
media library — can read from the same `slots` object via `useCmsSlots()`.
