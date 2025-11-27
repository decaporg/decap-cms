# Pagination Architecture - Developer Guide

## System Architecture

Decap CMS implements a **hybrid pagination system** that automatically switches between server-side and client-side pagination based on active features.

### Design Principles

1. **Server-side by default** - Fetch entries page-by-page for optimal performance
2. **Client-side when needed** - Switch automatically when sorting/filtering/grouping/i18n is active
3. **Transparent switching** - Users don't notice the mode change
4. **Backward compatible** - No breaking changes to existing collections

### Mode Selection Logic

```
Is pagination enabled in config?
├─ NO → Fetch all entries, no UI
└─ YES → Is i18n OR nested collection?
    ├─ YES → Client-side (must fetch all for grouping)
    └─ NO → Is sort/filter/group active?
        ├─ YES → Client-side (needs full dataset)
        └─ NO → Server-side (optimal)
```

---

## Component Architecture

### 1. Configuration (`packages/decap-cms-core/src/lib/pagination.ts`)

```typescript
// Config resolution: collection-level → global → default
isPaginationEnabled(collection, config): boolean
getPaginationConfig(collection, config): { enabled, per_page }
```

### 2. Backend Interface (`packages/decap-cms-core/src/backend.ts`)

```typescript
interface Backend {
  listEntries(collection, page): Promise<{ entries, cursor, pagination }>
  listAllEntries(collection): Promise<EntryValue[]>
}
```

**Implementation in backends** (`packages/decap-cms-backend-*/src/implementation.ts`):
- `entriesByFolder(collection, extension, { page, pageSize, pagination })`
- Azure, Bitbucket, GitLab, GitHub backends all support pagination options
- Falls back gracefully if backend doesn't support pagination

### 3. Redux State (`packages/decap-cms-core/src/reducers/entries.ts`)

```typescript
state.entries = {
  pages: {
    [collection]: {
      ids: string[]           // Current page IDs (server mode)
      sortedIds?: string[]    // ALL IDs sorted (client mode)
    }
  },
  pagination: {
    [collection]: {
      currentPage: number,
      pageSize: number,
      totalCount: number
    }
  }
}
```

**Key insight:** `sortedIds` presence indicates client-side mode.

### 4. Actions (`packages/decap-cms-core/src/actions/entries.ts`)

**Entry points:**
- `loadEntries(collection, page)` - Initial load
- `loadEntriesPage(collection, page)` - Navigate pages
- `sortByField(collection, key, direction)` - Sort (triggers client mode)
- `filterByField(collection, filter)` - Filter (triggers client mode)

**Flow:**
```
Server mode: loadEntriesPage → backend.listEntries → ENTRIES_SUCCESS
Client mode: sortByField → backend.listAllEntries → SORT_ENTRIES_SUCCESS (sets sortedIds)
            loadEntriesPage → just updates currentPage in Redux
```

### 5. Selectors (`packages/decap-cms-core/src/reducers/entries.ts`)

```typescript
selectEntries(state, collection, configPageSize?) {
  const sortedIds = state.getIn(['pages', collection, 'sortedIds']);
  
  if (sortedIds) {
    // Client mode: slice sortedIds for current page
    const start = (currentPage - 1) * pageSize;
    return sortedIds.slice(start, start + pageSize).map(id => getEntity(id));
  }
  
  // Server mode: return entries for current page
  return getPublishedEntries(state, collection);
}
```

**The `configPageSize` parameter** controls pagination:
- `undefined` → No pagination, return all entries
- `number` → Enable pagination with specified page size

### 6. UI Components

**`Pagination.js`** - Renders page controls with accessibility (ARIA labels, keyboard nav)

**`EntriesCollection.js`** - Passes `configPageSize` to selector, renders Pagination component

---

## Critical Integration Points

### i18n Collections

**Problem:** Files must be grouped by locale AFTER fetching:
- `en/post.md` + `de/post.md` → 1 entry
- Can't paginate files, must paginate grouped entries

**Solution:**
```typescript
// In loadEntries()
if (hasI18n(collection)) {
  response = await backend.listAllEntries(collection);
  entries = backend.processEntries(response, collection); // Groups by locale
  dispatch({ type: SORT_ENTRIES_SUCCESS, payload: { entries } }); // Enable client pagination
}
```

### Sorting/Filtering

**Why fetch all entries?**
- Cannot sort/filter partial results
- Need complete dataset for accurate ordering

**Trade-off:**
- Slower initial fetch
- Instant subsequent page navigation

### Grouping

Groups disable pagination entirely:
- Groups span across pages
- Uses `GROUP_ENTRIES_SUCCESS` instead of `SORT_ENTRIES_SUCCESS`
- `selectEntries()` returns all grouped entries

---

## Testing Strategy

### Unit Tests
- `pagination.ts`: Config resolution (global vs collection)
- `entries.ts` reducer: State transitions for `sortedIds`
- `selectEntries()`: Client vs server mode branching

### Integration Tests (`PaginationEdgeCases.spec.js`)
- Server → client mode transition (sorting triggers switch)
- Client → server mode transition (disable last filter)
- i18n + pagination (grouped entries paginated correctly)
- Large collections (>100 entries, multiple pages)

### E2E Tests
- Per-backend tests (GitHub, GitLab, Azure, Bitbucket)
- User flows: page navigation, sorting, filtering

---

## Edge Cases & Gotchas

### 1. **sortedIds vs ids**
- `ids`: Current page entries (server mode)
- `sortedIds`: ALL entry IDs (client mode)
- **Never use both simultaneously**

### 2. **i18n collections always use client mode**
- Even with pagination enabled, fetches all entries
- Performance impact for large i18n collections (>1000 files)

### 3. **Disabling last filter switches mode**
```typescript
// In filterByField()
if (isEmpty(filter)) {
  // Switching back to server mode
  dispatch(loadEntries(collection, 1));
}
```

### 4. **configPageSize parameter is critical**
- `undefined` → No pagination
- `number` → Pagination enabled
- Passed from `EntriesCollection` based on config

### 5. **Page numbers are 1-based**
- Backend APIs use 1-based indexing
- Array slicing uses 0-based: `(currentPage - 1) * pageSize`

---

## Performance Characteristics

### Server-side Mode
- ✅ Fast initial load (20-50 entries)
- ✅ Low memory (only current page in memory)
- ❌ Network call per page change
- ❌ Cannot sort/filter

### Client-side Mode
- ✅ Instant page navigation
- ✅ Instant sort/filter updates
- ❌ Slow initial load (fetches all entries)
- ❌ High memory (all entries in Redux)

### Recommendations
- Use server mode for large collections without sort/filter
- Use client mode for <500 entries
- i18n/nested collections have no choice (client mode required)

---

## Future Improvements

### 1. Backend-side Sorting/Filtering
Add parameters to `listEntries()`:
```typescript
listEntries(collection, page, { sortBy, filterBy })
```
Backends like GraphQL can sort server-side, reducing data transfer.

### 2. Virtual Scrolling
Replace page-based UI with infinite scroll, render only visible entries.

### 3. Smart Caching
Cache fetched pages in memory, invalidate on changes. Makes server mode feel instant.

### 4. Incremental i18n Grouping
Fetch and group in batches, display progressively.

---

## Developer Checklist

When modifying pagination code:

- [ ] Test both server and client modes
- [ ] Test i18n collections separately
- [ ] Verify `sortedIds` is set/unset correctly
- [ ] Check `configPageSize` is passed through selectors
- [ ] Test mode transitions (sort → unsort, filter → unfilter)
- [ ] Run `PaginationEdgeCases.spec.js` tests
- [ ] Verify page numbers are 1-based in UI, 0-based in array slicing
- [ ] Check accessibility (ARIA labels, keyboard nav)
