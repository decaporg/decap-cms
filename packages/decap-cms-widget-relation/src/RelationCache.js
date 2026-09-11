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
