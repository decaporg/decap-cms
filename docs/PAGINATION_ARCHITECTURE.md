# Pagination Architecture Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Collection.js                                                   │
│    └─> EntriesCollection.js                                     │
│          └─> Entries.js                                         │
│                ├─> EntryListing.js                              │
│                │     └─> EntryCard/EntryGrid                    │
│                └─> Pagination.js  ← NEW COMPONENT               │
│                      ├─> Previous/Next buttons                  │
│                      ├─> Page number display                    │
│                      └─> Items per page selector                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REDUX ACTIONS LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  actions/entries.ts                                              │
│    ├─> loadEntries(collection, page)                            │
│    ├─> loadEntriesPage(collection, page)      ← NEW             │
│    ├─> setEntriesPageSize(collection, size)   ← NEW             │
│    └─> entriesLoaded(collection, entries, cursor)               │
│                                                                  │
│  Pagination Utilities (lib/pagination.ts)      ← NEW             │
│    ├─> isPaginationEnabled(collection, config)                  │
│    ├─> getPaginationConfig(collection, config)                  │
│    └─> normalizePaginationConfig(config)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND CORE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  backend.ts                                                      │
│    ├─> listEntries(collection)                                  │
│    │     └─> Reads pagination config                            │
│    │     └─> Calls implementation.entriesByFolder()             │
│    └─> processEntries(entries, collection)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND IMPLEMENTATION LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│  backend-github/implementation.tsx (PHASE 2)                     │
│    ├─> entriesByFolder(folder, ext, depth, options)             │
│    │     ├─> Fetch all files from GitHub API                    │
│    │     ├─> Filter by extension                                │
│    │     ├─> Apply pagination (slice array)                     │
│    │     └─> Create cursor with pagination metadata             │
│    └─> getCursorAndFiles(files, page, pageSize)                 │
│          ├─> Calculate page count                               │
│          ├─> Slice files to current page                        │
│          └─> Create cursor with actions [prev, next, etc.]      │
│                                                                  │
│  backend-git-gateway/implementation.ts (PHASE 3)                 │
│    └─> Delegates to underlying backend (GitHub/GitLab)          │
│          └─> Passes pagination options through                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REDUX STATE                              │
├─────────────────────────────────────────────────────────────────┤
│  state.entries = {                                               │
│    entities: Map<entryId, Entry>,                               │
│    pages: Map<collectionName, {                                 │
│      ids: List<entryId>,          // Current page entry IDs     │
│      page: number,                 // Current page (1-indexed)  │
│      pageSize: number,             // Items per page            │
│      totalCount: number,           // Total available entries   │
│      cursor: Cursor,               // Navigation cursor         │
│      isFetching: boolean                                        │
│    }>,                                                           │
│    pagination: Map<collectionName, {  ← NEW                     │
│      userPageSize: number          // User preference           │
│    }>,                                                           │
│    sort: Sort,                                                   │
│    viewStyle: ViewStyle                                          │
│  }                                                               │
│                                                                  │
│  state.config = {                                                │
│    collections: [{                                               │
│      name: "posts",                                              │
│      pagination: {                 // ← NEW                      │
│        per_page: 100,                                            │
│        user_options: [25, 50, 100, 200]                          │
│      }                                                           │
│    }]                                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  localStorage                                                    │
│    ├─> pagination_pageSize_${collectionName}                    │
│    └─> pagination_lastPage_${collectionName}                    │
│                                                                  │
│  URL State                                                       │
│    └─> ?page=3&pageSize=50                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Cursor Flow (Pagination)

```
┌──────────────────────────────────────────────────────────────┐
│                     CURSOR STRUCTURE                          │
├──────────────────────────────────────────────────────────────┤
│  Cursor {                                                     │
│    actions: Set(['prev', 'next', 'first', 'last']),         │
│    meta: Map({                                                │
│      page: 3,              // Current page                   │
│      pageCount: 50,        // Total pages                    │
│      count: 5000,          // Total entries                  │
│      pageSize: 100,        // Items per page                 │
│      extension: 'md',                                         │
│      folder: 'content/posts',                                │
│      depth: 1                                                 │
│    }),                                                        │
│    data: Map({                                                │
│      files: [...],         // File metadata (not full data)  │
│      // OR store nothing for memory efficiency               │
│    })                                                         │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
              │
              ├─> actions.has('prev')   → Enable Previous button
              ├─> actions.has('next')   → Enable Next button
              ├─> actions.has('first')  → Enable First page button
              └─> actions.has('last')   → Enable Last page button
```

## User Interaction Flow

```
1. User opens collection
   │
   ├─> Check if pagination enabled
   │   ├─> YES → Load first page (e.g., 100 entries)
   │   │         └─> Show pagination controls
   │   └─> NO  → Load all entries (current behavior)
   │
   ▼
2. User clicks "Next Page"
   │
   ├─> Dispatch: loadEntriesPage(collection, currentPage + 1)
   │   └─> Check if page already in cache
   │       ├─> YES → Use cached entries
   │       └─> NO  → Fetch from backend
   │                 └─> Backend slices data
   │                     └─> Return page entries + updated cursor
   │
   ▼
3. Redux updates state
   │
   ├─> state.entries.pages[collection].page = newPage
   ├─> state.entries.pages[collection].ids = newPageIds
   └─> state.entries.entities merges new entries
   │
   ▼
4. React re-renders
   │
   └─> EntryListing shows new page
       └─> Pagination component updates
           ├─> Page 4 of 50
           ├─> Previous/Next button states
           └─> Current page highlighted
```

## Configuration Resolution Flow

```
Global Config:
  pagination:
    enabled: true
    per_page: 100
    user_options: [50, 100, 200]
          │
          ▼
Collection Config:
  collections:
    - name: posts
      pagination: true        ──┐
                                │
    - name: products            │
      pagination:               │ Merge with
        per_page: 50           ─┤ global config
        user_options: [25, 50] ─┤
                                │
    - name: pages               │
      pagination: false        ─┘
          │
          ▼
Resolved Config:
  posts:
    per_page: 100              (from global)
    user_options: [50, 100, 200]  (from global)
  
  products:
    per_page: 50               (from collection, overrides global)
    user_options: [25, 50]     (from collection, overrides global)
  
  pages:
    pagination: disabled       (explicitly disabled)
```

## Phase Implementation Order

```
PHASE 1: Configuration
├─> Add types
├─> Add parsing logic
├─> Add helper functions
└─> Tests
    │
    ▼
PHASE 2: GitHub Backend
├─> Modify entriesByFolder()
├─> Update getCursorAndFiles()
├─> Handle pagination options
└─> Tests
    │
    ▼
PHASE 3: Git Gateway
├─> Pass options through
└─> Tests
    │
    ▼
PHASE 4: Redux
├─> Update reducers
├─> Update actions
├─> Add selectors
└─> Tests
    │
    ▼
PHASE 5: UI
├─> Create Pagination component
├─> Integrate into views
├─> Add loading states
└─> Tests
    │
    ▼
PHASE 6: Integration
├─> Sorting + Pagination
├─> Filtering + Pagination
├─> Search + Pagination
├─> Edge cases
└─> Tests
    │
    ▼
PHASE 7: Polish
├─> localStorage persistence
├─> URL state
├─> Keyboard shortcuts
└─> Tests
    │
    ▼
PHASE 8: Documentation & Testing
├─> User docs
├─> Developer docs
├─> E2E tests
└─> Performance tests
```

## Backward Compatibility

```
Existing Config (no changes):
  collections:
    - name: posts
      folder: content/posts
      
Behavior:
  ├─> pagination = undefined
  ├─> isPaginationEnabled() = false
  └─> All entries loaded (current behavior)
      └─> No UI changes
      └─> No performance changes
      
✅ 100% Backward Compatible
```

## Edge Cases Handling

```
1. Empty Collection
   └─> Show "No entries" message
       └─> Hide pagination controls

2. Single Page (entries < pageSize)
   └─> Show all entries
       └─> Hide pagination controls

3. Page > Available Pages
   └─> Redirect to last valid page
       └─> Show notification

4. Entry Added During View
   └─> Refresh current page
       └─> Update total count

5. Entry Deleted During View
   └─> Refresh current page
       └─> Adjust page if now empty

6. Nested Collection + Pagination
   └─> Log warning
       └─> Ignore pagination (load all)
       └─> Reason: Need all for tree

7. i18n Collection + Pagination
   └─> Log warning
       └─> Ignore pagination (load all)
       └─> Reason: Need all for languages
```

## Performance Comparison

```
BEFORE (No Pagination):
  Collection: 3000 entries
  
  Initial Load:
    ├─> Fetch: 3000 files metadata   (~15s)
    ├─> Fetch: 3000 files content    (~45s)
    ├─> Parse: 3000 entries          (~5s)
    ├─> React render: 3000 cards     (~10s)
    └─> Total: ~75s
    
  Memory: ~150MB
  
  Scroll Performance: Laggy (3000 DOM nodes)

─────────────────────────────────────────────────

AFTER (Pagination enabled, pageSize: 100):
  Collection: 3000 entries
  
  Initial Load:
    ├─> Fetch: 3000 files metadata   (~15s) *
    ├─> Fetch: 100 files content     (~1.5s)
    ├─> Parse: 100 entries           (~0.2s)
    ├─> React render: 100 cards      (~0.3s)
    └─> Total: ~17s
    
  Memory: ~5MB
  
  Scroll Performance: Smooth (100 DOM nodes)
  
  Page Navigation: ~2s per page
  
  * Metadata fetch still required for total count
    Future: Could use GitHub API pagination
```

## Future Enhancements (Out of Scope)

```
1. Server-side Pagination
   └─> Use GitHub API pagination
       └─> Avoid loading all file metadata
       └─> Further performance improvement

2. Infinite Scroll
   └─> Alternative to pagination controls
       └─> Auto-load next page on scroll

3. Virtual Scrolling
   └─> Render only visible entries
       └─> Keep all in memory but not DOM

4. Smart Caching
   └─> Cache adjacent pages
       └─> Prefetch on hover

5. Server-side Operations
   └─> Sorting/Filtering on backend
       └─> Requires backend API changes
```
