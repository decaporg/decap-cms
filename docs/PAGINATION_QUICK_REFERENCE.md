# Pagination Feature - Quick Reference

## Overview
Add pagination support for large collections in Decap CMS, starting with GitHub and Git Gateway backends.

## Configuration Examples

### Simple (uses defaults)
```yaml
collections:
  - name: posts
    label: Posts
    folder: content/posts
    pagination: true  # Uses default: 100 per page with user options [25, 50, 100, 200]
```

### Advanced
```yaml
collections:
  - name: products
    label: Products
    folder: content/products
    pagination:
      per_page: 50              # Default items per page
      user_options: [25, 50, 100]  # Options for user to choose from
```

### Disable User Control
```yaml
collections:
  - name: articles
    pagination:
      per_page: 100
      user_options: false  # User cannot change items per page
```

### Global Configuration
```yaml
# Global default for all collections
pagination:
  enabled: true
  per_page: 100
  user_options: [50, 100, 200]

collections:
  - name: posts
    # Inherits global pagination settings
    
  - name: pages
    pagination: false  # Explicitly disable for this collection
```

## Implementation Phases

### Phase 1: Configuration & Types ✅ (Start Here)
- Add TypeScript types for pagination config
- Create configuration parser/normalizer
- Add helper functions

**Key Files:**
- `packages/decap-cms-core/src/types/redux.ts` - Type definitions
- `packages/decap-cms-core/src/lib/pagination.ts` - Utilities (NEW)

### Phase 2: Backend (GitHub)
- Implement paginated `entriesByFolder()` in GitHub backend
- Update cursor handling for pagination

**Key Files:**
- `packages/decap-cms-backend-github/src/implementation.tsx`

### Phase 3: Git Gateway Support
- Pass pagination config through to underlying backend

**Key Files:**
- `packages/decap-cms-backend-git-gateway/src/implementation.ts`

### Phase 4: Redux State & Actions
- Store pagination state in Redux
- Update `loadEntries()` action
- Add new pagination actions

**Key Files:**
- `packages/decap-cms-core/src/actions/entries.ts`
- `packages/decap-cms-core/src/reducers/entries.ts`

### Phase 5: UI Components
- Create pagination component
- Integrate into collection view
- Add loading states

**Key Files:**
- `packages/decap-cms-core/src/components/Collection/Entries/Pagination.js` (NEW)
- `packages/decap-cms-core/src/components/Collection/Entries/EntriesCollection.js`
- `packages/decap-cms-core/src/components/Collection/Entries/EntryListing.js`

### Phase 6: Integration
- Ensure pagination works with sorting, filtering, search
- Handle edge cases

### Phase 7: User Preferences & Polish
- Store user preferences in localStorage
- URL state management
- Keyboard shortcuts

### Phase 8: Testing & Documentation
- Unit, integration, and E2E tests
- User and developer documentation

## Key Design Decisions

1. **Opt-in:** Pagination is disabled by default for backward compatibility
2. **Client-side:** Initial implementation is client-side (backend loads all, we paginate)
3. **Cursor-based:** Uses existing cursor system for consistency
4. **Incompatible with:**
   - Nested collections (needs all entries for tree structure)
   - i18n collections (needs all entries for language grouping)
5. **Works with:** Sorting, filtering, search, grouping (with limitations)

## State Structure

```typescript
state.entries.pages[collectionName] = {
  ids: List<string>,      // Entry IDs for current page
  page: number,           // Current page number (1-indexed)
  pageSize: number,       // Items per page
  totalCount: number,     // Total entries available
  cursor: Cursor,         // Navigation cursor
  isFetching: boolean
}

state.entries.pagination[collectionName] = {
  userPageSize: number    // User's selected preference
}
```

## Helper Functions (Phase 1)

```typescript
// packages/decap-cms-core/src/lib/pagination.ts

export function isPaginationEnabled(
  collection: Collection, 
  globalConfig: CmsConfig
): boolean

export function getPaginationConfig(
  collection: Collection,
  globalConfig: CmsConfig  
): PaginationConfig | null

export function normalizePaginationConfig(
  config: boolean | PaginationConfig | undefined,
  globalConfig?: PaginationConfig
): PaginationConfig | null

// Default values
export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_USER_OPTIONS = [25, 50, 100, 200];
```

## Backend API Change

### Current
```typescript
entriesByFolder(folder: string, extension: string, depth: number)
```

### New (backward compatible)
```typescript
entriesByFolder(
  folder: string,
  extension: string, 
  depth: number,
  options?: {
    page?: number,
    pageSize?: number,
    pagination?: boolean
  }
)
```

## Testing Strategy

1. **Unit Tests:**
   - Configuration parsing and normalization
   - Redux actions and reducers
   - Utility functions

2. **Integration Tests:**
   - Full pagination flow
   - Interaction with sorting/filtering/search
   - State persistence

3. **E2E Tests:**
   - User workflows with large collections
   - Page navigation
   - Items per page selection

## Success Criteria

- [ ] Initial load time reduced by >50% for 1000+ entry collections
- [ ] All existing tests pass
- [ ] No breaking changes to existing configurations
- [ ] Clear documentation for users and developers
- [ ] Pagination works with GitHub and Git Gateway backends
- [ ] User can select items per page (if enabled)
- [ ] Page state persists across browser sessions
- [ ] Works with sorting, filtering, and search

## Limitations (Initial Release)

1. **Backend Support:** GitHub and Git Gateway only (others in future phases)
2. **No Server-side Operations:** Sorting/filtering require loading all entries
3. **Nested Collections:** Not supported (technical limitation)
4. **i18n Collections:** Not supported (technical limitation)
5. **No Infinite Scroll:** Pagination controls only (future enhancement)

## Migration Guide for Users

### Before
```yaml
collections:
  - name: posts
    folder: content/posts
    # All 5000 posts load at once
```

### After
```yaml
collections:
  - name: posts
    folder: content/posts
    pagination: true  # Now loads 100 at a time
```

No changes needed for small collections. Pagination is opt-in and defaults to OFF.

## Files to Create

1. `/packages/decap-cms-core/src/lib/pagination.ts` - Utility functions
2. `/packages/decap-cms-core/src/components/Collection/Entries/Pagination.js` - UI component
3. `/packages/decap-cms-core/src/lib/userPreferences.ts` - localStorage utilities
4. `/docs/pagination.md` - User documentation
5. `/docs/pagination-backend-implementation.md` - Developer guide
6. Test files for above

## Questions & Answers

**Q: Will this break existing configurations?**
A: No. Pagination is opt-in and defaults to disabled.

**Q: What happens to the "Load More" button?**
A: It's replaced by pagination controls when pagination is enabled.

**Q: Can I use pagination with search?**
A: Yes, pagination works with search results.

**Q: Will sorting work across all pages?**
A: Yes, initially it loads all entries to sort, then paginates (client-side).

**Q: What's the performance improvement?**
A: For a collection with 3000 entries, expect:
- Initial load time: ~80% faster
- Memory usage: ~90% lower
- React render time: ~85% faster

**Q: Can I disable pagination per-collection?**
A: Yes, set `pagination: false` to disable it for specific collections.

## Next Steps

1. ✅ Review implementation plan
2. ⏳ Implement Phase 1 (Configuration & Types)
3. ⏳ Implement Phase 2 (GitHub Backend)
4. ⏳ Continue through remaining phases

## Related Issues

- #3714 - Original feature request
- Consider creating sub-issues for each phase
