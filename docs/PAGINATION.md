# Pagination

## Overview

Decap CMS supports pagination for collections with many entries. The system uses a **hybrid approach**, automatically switching between server-side and client-side pagination based on active features.

## Configuration

### Global Configuration

Enable pagination for all collections:

```yaml
pagination:
  enabled: true
  per_page: 25
```

### Per-Collection Configuration

Override pagination settings for specific collections:

```yaml
collections:
  - name: posts
    label: Posts
    folder: content/posts
    pagination:
      enabled: true
      per_page: 10
```

**Priority:** Collection settings override global settings.

## How It Works

### Hybrid Pagination

Decap CMS intelligently switches between two pagination modes:

#### Server-Side Pagination (Default)

- **When:** No sorting, filtering, or grouping is active
- **Behavior:** Only the current page of entries is loaded from the backend
- **Benefits:** Fast initial load, low memory usage
- **Best for:** Large collections with many entries

#### Client-Side Pagination (Automatic)

- **When:** Sorting, filtering, or grouping is active
- **Behavior:** All entries are loaded once, then paginated in the browser
- **Benefits:** Instant page navigation, instant sorting/filtering
- **Best for:** Advanced features that require the full dataset

### When Pagination is Disabled

Pagination is automatically disabled when:

- **Grouping is active** - Grouping requires all entries to organize them correctly
- **i18n grouping is active** - Locale-grouped entries need the full dataset
- **Pagination is disabled in config** - `enabled: false`

## Usage

### Navigating Pages

Use the pagination controls at the bottom of the entry list:

- **First/Last** - Jump to first or last page
- **Previous/Next** - Navigate one page at a time
- **Page indicator** - Shows current page and total pages

### Combining with Other Features

**Sorting:**
- Click column headers to sort
- Automatically switches to client-side pagination
- All entries are loaded and sorted in the browser

**Filtering:**
- Use the search/filter controls
- Automatically switches to client-side pagination
- All entries are loaded and filtered in the browser

**Grouping:**
- Select a grouping option
- Pagination is disabled
- All entries are loaded and displayed in groups

## Limitations

### Performance Considerations

**Client-Side Mode:**
- Initial load fetches ALL entries (can be slow for 1000+ entries)
- Increased memory usage
- Subsequent page navigation is instant

**Server-Side Mode:**
- Fast initial load (only fetches current page)
- Low memory footprint
- Each page navigation requires a network request

### Feature Restrictions

- Cannot sort/filter when using server-side pagination
- Cannot paginate when grouping is active
- i18n collections always use client-side mode

## Troubleshooting

### Pagination controls are missing

**Possible causes:**
- Grouping is active (pagination is disabled during grouping)
- Only one page of entries exists
- Pagination is disabled in config
- Collection has very few entries

**Solution:** Check your config and disable grouping if you need pagination.

### All entries load at once (slow)

**Cause:** Sorting, filtering, or grouping triggers client-side pagination.

**Solution:** 
- Avoid sorting/filtering for very large collections
- Use server-side pagination when possible (no sorting/filtering/grouping)
- Consider splitting large collections into smaller ones

### Page size is not respected

**Cause:** Configuration may be incorrect or overridden.

**Solution:** 
- Check collection-level `pagination.per_page` setting
- Check global `pagination.per_page` setting
- Collection config takes precedence over global config

## Best Practices

1. **Enable pagination for large collections** (100+ entries)
2. **Use reasonable page sizes** (10-50 entries per page)
3. **Avoid sorting/filtering on very large collections** (1000+ entries)
4. **Consider performance** when enabling features that trigger client-side mode
5. **Test with realistic data volumes** to ensure good user experience

### Performance Optimization

#### Caching

Decap CMS automatically caches fetched entries to improve performance.

- **What's cached:** All entries loaded for i18n or nested collections
- **Cache duration:** 5 minutes (automatically expired)
- **Invalidation:** Automatic on entry create/update/delete
- **Storage:** Browser localStorage (IndexedDB)

**Benefits:**
- Faster subsequent loads when navigating between collections
- Reduced API calls to your Git provider
- Improved UX for sorting and filtering

**Note:** Cache is collection-specific and automatically managed. No configuration needed.

#### Collection Size Recommendations

| Collection Size | Recommended Setup | Expected Performance |
|----------------|-------------------|---------------------|
| < 50 entries | Server or client pagination | Excellent |
| 50-200 entries | Client pagination with caching | Very good |
| 200-500 entries | Server pagination, avoid sorting | Good |
| 500-1000 entries | Server pagination only | Acceptable |
| 1000+ entries | Consider splitting collections | Variable |

#### i18n Collections

i18n collections have special performance considerations:

**File count multiplication:**
- 300 entries × 3 locales = 900 files to fetch
- Initial load will be slower than non-i18n collections

**Recommendations:**
- Keep i18n collections under 500 entries
- Use caching (automatic in v3.9+)
- Consider separate collections per locale for very large datasets

#### Large Collections Best Practices

For collections with 500+ entries:

1. **Disable client-side features:**
   ```yaml
   collections:
     - name: posts
       pagination:
         enabled: true
         per_page: 20
       # Avoid view_filters and view_groups for large collections
   ```

2. **Split into multiple collections:**
   ```yaml
   collections:
     - name: posts-2024
       folder: content/posts/2024
     - name: posts-2023
       folder: content/posts/2023
   ```

3. **Use folder structures:**
   ```yaml
   collections:
     - name: posts
       folder: content/posts
       # Organize by year/month
       # content/posts/2024/01/post.md
   ```

4. **Monitor performance:**
   - Check browser console for cache hit/miss logs
   - Monitor network tab for API call frequency
   - Test with realistic data volumes

## Accessibility

Pagination controls are fully accessible:

- ARIA labels for screen readers
- Keyboard navigation support
- Live region announcements for page changes
- Proper disabled state handling

All pagination text is localized and can be customized via locale files.
