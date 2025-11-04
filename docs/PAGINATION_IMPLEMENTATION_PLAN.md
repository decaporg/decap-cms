# Pagination Implementation Plan for Decap CMS

## Issue Reference
https://github.com/decaporg/decap-cms/issues/3714

## Overview
Add pagination support to large collections in Decap CMS. Pagination will be opt-in per collection or globally. It will work local, GitHub, and Git Gateway backends.

## Current State Analysis

### How Entries Are Currently Loaded

1. **Entry Loading Flow:**
   - `loadEntries()` action in `/packages/decap-cms-core/src/actions/entries.ts` (line 576)
   - Calls backend's `listEntries()` method
   - Backend calls implementation's `entriesByFolder()` or `entriesByFiles()`
   - Entries are stored in Redux state at `state.entries`
   - All entries are loaded at once (no chunking)

2. **Current Cursor System:**
   - Defined in `/packages/decap-cms-lib-util/src/Cursor.ts`
   - Used for "load more" functionality
   - Actions: `next`, `prev`, `first`, `last`, `append_next`
   - Metadata includes: `page`, `count`, `pageSize`, `pageCount`
   - Currently only Algolia integration and some backends use cursor-based pagination
   - Test backend implements basic cursor pagination (line 202 in `/packages/decap-cms-backend-test/src/implementation.ts`)

3. **Entry Display:**
   - `EntriesCollection` component in `/packages/decap-cms-core/src/components/Collection/Entries/EntriesCollection.js`
   - `EntryListing` component handles the actual list display
   - Has "Load More" functionality via `handleLoadMore()` that checks for `append_next` cursor action
   - Currently loads ALL entries on mount via `loadEntries(collection)`

4. **Backend Implementations:**
   - GitHub: `/packages/decap-cms-backend-github/src/implementation.tsx`
     - Has `getCursorAndFiles()` method that creates cursors (line 393)
     - `entriesByFolder()` uses cursors but returns all files
     - `allEntriesByFolder()` exists for fetching everything
   - Git Gateway: `/packages/decap-cms-backend-git-gateway/src/implementation.ts`
     - Delegates to underlying backend (GitHub/GitLab)
     - Line 410: `entriesByFolder()` delegates to backend
   - GitLab, Bitbucket, Gitea: Similar patterns

### Key Files to Modify

1. **Configuration:**
   - `/packages/decap-cms-core/src/types/redux.ts` - Add pagination types to `CmsCollection`
   - Config validation/parsing logic

2. **Backend Layer:**
   - `/packages/decap-cms-backend-github/src/implementation.tsx` - Implement paginated `entriesByFolder()`
   - `/packages/decap-cms-backend-git-gateway/src/implementation.ts` - Pass pagination through
   - `/packages/decap-cms-lib-util/src/implementation.ts` - Update `entriesByFolder()` helper

3. **Redux/Actions Layer:**
   - `/packages/decap-cms-core/src/actions/entries.ts` - Modify `loadEntries()` to support pagination
   - `/packages/decap-cms-core/src/reducers/entries.ts` - Handle paginated entries state

4. **UI Layer:**
   - `/packages/decap-cms-core/src/components/Collection/Entries/EntriesCollection.js` - Handle pagination state
   - `/packages/decap-cms-core/src/components/Collection/Entries/EntryListing.js` - Add pagination UI
   - `/packages/decap-cms-core/src/components/Collection/Entries/Entries.js` - Pass pagination props

5. **Backend Core:**
   - `/packages/decap-cms-core/src/backend.ts` - Modify `listEntries()` to support pagination config

## Configuration Schema

### Per-Collection Configuration
```yaml
collections:
  - name: posts
    label: Posts
    folder: content/posts
    # Simple boolean (uses defaults)
    pagination: true
    
  - name: products
    label: Products  
    folder: content/products
    # Detailed configuration
    pagination:
      per_page: 50 # default
```

### Global Configuration
```yaml
# In root config
pagination:
  enabled: true
  per_page: 100
  
collections:
  - name: posts
    # Inherits global pagination
    
  - name: pages
    # Override to disable
    pagination: false
```

### TypeScript Types
```typescript
// In CmsCollection interface and Global config
pagination?: boolean | {
  enabled?: boolean;  // Enable pagination (default: true)
  per_page?: number;  // Default items per page (default: 100)
}
```

## Implementation Phases

### Phase 1: Configuration & Types (Foundation)
**Goal:** Add pagination configuration support without changing behavior

**Tasks:**
1. Add `pagination` field to `CmsCollection` type in `/packages/decap-cms-core/src/types/redux.ts`
2. Add global `pagination` to `CmsConfig` type
3. Create configuration parser/normalizer:
   - Merge global and per-collection settings
   - Normalize boolean to full config object
   - Set defaults: `per_page: 50`
4. Add helper functions:
   - `isPaginationEnabled(collection, globalConfig): boolean`
   - `getPaginationConfig(collection, globalConfig): PaginationConfig`

**Files to Create:**
- `/packages/decap-cms-core/src/lib/pagination.ts` - Pagination utilities

**Files to Modify:**
- `/packages/decap-cms-core/src/types/redux.ts`
- `/packages/decap-cms-core/src/reducers/config.ts` (if needed for validation)

### Phase 2: Backend Implementation (local, GitHub)
**Goal:** Make GitHub and local backend return paginated results based on config

**Tasks:**
1. Modify `GitHub.entriesByFolder()` to:
   - Accept optional `page` and `pageSize` parameters
   - Slice the files array to return only the requested page
   - Create proper cursor with `next`/`prev` actions
   - Store full file list in cursor data for subsequent pages
2. Update `getCursorAndFiles()` to use dynamic pageSize from config
3. Ensure cursor metadata includes all necessary info
4. Handle edge cases (last page, first page, empty results)
5. Add tests for paginated loading

**Files to Modify:**
- `/packages/decap-cms-backend-github/src/implementation.tsx`
- `/packages/decap-cms-lib-util/src/implementation.ts` (if needed)

### Phase 3: Git Gateway Support
**Goal:** Make Git Gateway pass pagination through to GitHub backend

**Tasks:**
1. Update `GitGateway.entriesByFolder()` to pass pagination params
2. Ensure cursor is properly forwarded
3. Test with local, GitHub and GitLab backends

**Files to Modify:**
- `/packages/decap-cms-backend-git-gateway/src/implementation.ts`

### Phase 4: Redux State & Actions
**Goal:** Handle pagination state in Redux

**Tasks:**
1. Extend entries reducer to store:
   - Current page number per collection
   - Total count per collection
   - Page size per collection
   - User's selected page size preference
2. Modify `loadEntries()` action to:
   - Read pagination config from collection
   - Pass `page` and `pageSize` to backend
   - Handle first load vs. page navigation
3. Add new actions:
   - `loadEntriesPage(collection, page)`
   - `setEntriesPageSize(collection, pageSize)`
4. Store user preferences in localStorage
5. Add action tests

**Files to Modify:**
- `/packages/decap-cms-core/src/actions/entries.ts`
- `/packages/decap-cms-core/src/reducers/entries.ts`

**New Selectors:**
- `selectEntriesPagination(state, collectionName)`
- `selectEntriesPageSize(state, collectionName)`

### Phase 5: UI Components
**Goal:** Add pagination controls to collection view

**Tasks:**
1. Create pagination component:
   - Page number display (e.g., "Page 2 of 45")
   - Previous/Next buttons
   - First/Last buttons (optional)
2. Integrate pagination into `EntriesCollection`:
   - Show pagination at the bottom
   - Handle page change events
   - Show loading state during page transitions
3. Update `Entries` component:
   - Pass pagination props
   - Handle no entries on current page
4. Ensure "Load More" is disabled when pagination is active
5. Add loading indicators
6. Preserve pagination state during:
   - Sorting
   - Filtering  
   - Search
7. Add localization strings (only English for now)

**Files to Modify:**
- `/packages/decap-cms-core/src/components/Collection/Entries/EntriesCollection.js`
- `/packages/decap-cms-core/src/components/Collection/Entries/EntryListing.js`
- `/packages/decap-cms-core/src/components/Collection/Entries/Entries.js`

**Files to Create:**
- `/packages/decap-cms-core/src/components/Collection/Entries/Pagination.js`

**Localization:**
- `/packages/decap-cms-locales/src/*/index.js` - Add pagination strings


### Phase 6: Integration with Existing Features & i18n Collections
**Goal:** Ensure pagination works with sorting, filtering, search, and i18n collections

**Tasks:**
1. **Sorting:**
   - Reset to page 1 when sort changes
   - Maintain pagination through sort
   - Update `sortByField()` action
2. **Filtering:**
   - Reset to page 1 when filter changes
   - Recalculate page count based on filtered results
   - Update `filterByField()` action
3. **Grouping:**
   - Decide: paginate per group or across all groups?
   - Implement chosen approach
4. **Search:**
   - Pagination should work with search results
   - Search should reset to page 1
5. **i18n Collections:**
   - Pagination is supported for i18n collections, but all entries for all locales are loaded into memory first.
   - Pagination will be applied at the UI layer to limit DOM nodes rendered for i18n collections.
   - Ensure pagination controls and state work correctly with grouped i18n entries.
   - Add tests for i18n collection pagination behavior.
6. **Nested Collections:**
   - Pagination is not supported for nested collections for now

**Files to Modify:**
- `/packages/decap-cms-core/src/actions/entries.ts` - All entry action creators
- `/packages/decap-cms-core/src/backend.ts` - Check for incompatible features
### Phase 8: Testing & Documentation
**Goal:** Ensure quality and provide documentation

**Tasks:**
1. Unit tests:
   - Configuration parsing
   - Action creators
   - Reducers
   - Selectors
   - Backend implementations
   - Pagination logic for i18n collections
2. Integration tests:
   - Full pagination flow
   - Interaction with sorting/filtering
   - State persistence
   - i18n collection pagination
3. E2E tests:
   - User workflows with pagination
   - Large collections (1000+ entries)
   - i18n collections with many locales/entries
4. Documentation:
   - Configuration guide
   - Backend implementation guide for other backends
   - Migration guide for users
5. Performance testing:
   - Measure improvement with large collections
   - Memory usage comparison

**Files to Create:**
- `/docs/pagination.md` - User documentation
- `/docs/pagination-backend-implementation.md` - Developer guide

### Phase 7: User Preferences & Polish
**Goal:** Make pagination user-friendly and persistent

**Tasks:**
1. Store user preferences:
   - Selected page size per collection
   - Use localStorage
   - Sync across browser tabs
2. URL state:
   - Add `?page=N` to URL
   - Deep link support
   - Browser back/forward support
3. Keyboard shortcuts:
   - Arrow keys for prev/next page
   - Number keys for jump to page
4. Loading states:
   - Skeleton loaders for entries
   - Smooth transitions between pages
5. Empty state handling:
   - Friendly message when page is beyond available entries
   - Auto-navigate to last valid page
6. Performance optimization:
   - Cache recently viewed pages
   - Prefetch next page
7. Accessibility:
   - ARIA labels for pagination controls
   - Keyboard navigation
   - Screen reader announcements

**Files to Create:**
- `/packages/decap-cms-core/src/lib/userPreferences.ts` - localStorage utilities

**Files to Modify:**
- Various component files for UX improvements

### Phase 8: Testing & Documentation
**Goal:** Ensure quality and provide documentation

**Tasks:**
1. Unit tests:
   - Configuration parsing
   - Action creators
   - Reducers
   - Selectors
   - Backend implementations
2. Integration tests:
   - Full pagination flow
   - Interaction with sorting/filtering
   - State persistence
3. E2E tests:
   - User workflows with pagination
   - Large collections (1000+ entries)
4. Documentation:
   - Configuration guide
   - Backend implementation guide for other backends
   - Migration guide for users
5. Performance testing:
   - Measure improvement with large collections
   - Memory usage comparison

**Files to Create:**
- `/docs/pagination.md` - User documentation
- `/docs/pagination-backend-implementation.md` - Developer guide

### Phase 9: Additional Backends (Future)
**Goal:** Add pagination support to other backends

**Backends to implement (in order of priority):**
1. GitLab
2. Bitbucket  
3. Gitea
4. Azure DevOps
5. Test backend (for development)

**Each backend requires:**
1. Modify `entriesByFolder()` implementation
2. Update cursor handling
3. Add tests
4. Update documentation

## Technical Considerations

### Cursor vs Page-Based Pagination

**Current Implementation:** Hybrid approach
- Backends create cursors with page metadata
- Cursor stores full file list in `data`
- Slicing happens in backend before returning to Redux

**Proposed for Phase 2-3:**
- Keep cursor-based API for consistency
- Store page metadata in cursor.meta
- Use cursor.data to cache file references (not full data)
- Backend returns only current page's entries

### State Management

**Redux State Structure:**
```typescript
state.entries = {
  entities: Map<string, Entry>,  // All loaded entries by ID
  pages: Map<collectionName, {
    ids: List<string>,           // Entry IDs for current page
    page: number,                // Current page number
    pageSize: number,            // Items per page
    totalCount: number,          // Total entries across all pages
    isFetching: boolean,
    cursor: Cursor               // For pagination navigation
  }>,
  sort: Sort,
  viewStyle: ViewStyle,
  pagination: Map<collectionName, {
    userPageSize: number         // User's selected page size
  }>
}
```

### Backward Compatibility

**Non-Breaking Changes:**
1. Pagination is opt-in (default: disabled)
2. When disabled, behavior is unchanged
3. Cursor system is already in place, just enhanced
4. Existing collections without pagination config continue working

### Performance Implications

**Benefits:**
- Reduced initial load time
- Lower memory usage
- Faster React rendering (fewer DOM nodes)
- Better UX for large collections (3000+ entries)

**Tradeoffs:**
- Additional requests for page navigation
- Sorting/filtering across all entries requires loading all pages
- Search might need all entries loaded

**Mitigation:**
- Cache loaded pages in Redux
- Show clear loading indicators
- Prefetch next page on hover
- Consider server-side sorting/filtering (future enhancement)

## API Changes

### Backend API (Implementation Interface)

**Current:**
```typescript
entriesByFolder(folder: string, extension: string, depth: number): Promise<ImplementationEntry[]>
```

**Proposed (backward compatible):**
```typescript
entriesByFolder(
  folder: string, 
  extension: string, 
  depth: number,
  options?: {
    page?: number,        // Page number (1-indexed)
    pageSize?: number,    // Items per page
    pagination?: boolean  // Enable pagination
  }
): Promise<ImplementationEntry[]>
```

The returned entries array will have cursor attached via `CURSOR_COMPATIBILITY_SYMBOL` as before, but cursor will include pagination metadata.

## Edge Cases to Handle

1. **Empty collections:** Show appropriate message
2. **Single page:** Hide pagination controls
3. **Page beyond available:** Redirect to last page
4. **Config changes:** Handle pageSize changes gracefully
5. **Concurrent edits:** Entry added/deleted while viewing page
6. **Network errors:** Retry mechanism, show error state
7. **Browser back/forward:** Sync with URL state
8. **Nested collections:** Disable pagination, show warning
9. **i18n collections:** Pagination is supported, but all entries are loaded into memory; pagination is applied at the UI layer to limit DOM nodes. Show warning if backend pagination is requested for i18n collections.
9. **Search + pagination:** Search should work across all pages
10. **Mixed backends:** Some backends support pagination, others don't

## Success Metrics

1. **Performance:**
   - Initial load time reduced by >50% for collections with 1000+ entries
   - Memory usage reduced proportionally
   - React render time improved

2. **UX:**
   - Clear pagination controls
   - Responsive page transitions (<500ms)
   - Intuitive navigation

3. **Compatibility:**
   - All existing tests pass
   - No breaking changes to API
   - Works with all supported features (where compatible)

## Future Enhancements (Out of Scope for Initial Implementation)

1. **Infinite scroll** option instead of pagination
2. **Virtual scrolling** for very large lists
3. **Server-side sorting/filtering** for paginated results
4. **Bulk operations** across pages
5. **Jump to page** input
6. **Configurable pagination position** (top/bottom/both)
7. **Remember last visited page** per collection
8. **Pagination analytics** (which pages are visited most)

## Questions to Resolve

1. Should pagination work with grouping? How?
2. Should we cache all visited pages or just current?
3. What's the ideal default page size? (Proposed: 100)
4. Should we support infinite scroll as an alternative?
5. How do we handle sorting/filtering when pagination is active?
   - Option A: Load all entries, sort/filter, then paginate (current behavior)
   - Option B: Only sort/filter current page (faster, less accurate)
   - Option C: Server-side sorting/filtering (requires backend changes)
   - **Proposed:** Start with Option A for compatibility

## Timeline Estimate

- **Phase 1:** 2-3 days
- **Phase 2:** 3-4 days
- **Phase 3:** 1-2 days
- **Phase 4:** 3-4 days
- **Phase 5:** 4-5 days
- **Phase 6:** 3-4 days
- **Phase 7:** 2-3 days
- **Phase 8:** 3-4 days

**Total:** ~3-4 weeks for core implementation (Phases 1-8)

Each additional backend (Phase 9): 2-3 days per backend

## Next Steps

1. Review and validate this plan
2. Create GitHub issues for each phase
3. Set up feature branch: `feat/pagination`
4. Begin Phase 1 implementation
5. Regular check-ins and adjustments as needed
