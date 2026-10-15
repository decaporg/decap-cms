/**
 * Memoises relation lookups for the life of the page, keyed by
 * collection + search fields + term + file.
 *
 * Only RESOLVED values are stored — a rejected `queryFn` leaves the key empty
 * so the next caller tries again. That is load-bearing rather than incidental:
 * the query thunk resolves even when the request failed, so before its callers
 * learned to reject (see `hitsFromQueryResult` in RelationControl) a single
 * timeout was cached as "this collection is empty" and every later open of the
 * dropdown read it back, until the page was reloaded.
 */
class RelationCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async getOptions(collection, searchFields, term, file, queryFn) {
    const cacheKey = `${collection}-${searchFields.join(',')}-${term || ''}-${file || ''}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const request = queryFn();
    this.pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      this.ensureCacheSize();
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  invalidateCollection(collection) {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${collection}-`)) {
        this.cache.delete(key);
      }
    }
  }

  ensureCacheSize() {
    const maxSize = 100;
    if (this.cache.size > maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const relationCache = new RelationCache();

export default relationCache;
