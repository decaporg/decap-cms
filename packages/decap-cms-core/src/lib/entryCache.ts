/**
 * Entry Cache Module
 *
 * Provides localStorage-based caching for collection entries to improve performance
 * when navigating between pages, sorting, or filtering.
 *
 * Cache Strategy:
 * - Store fetched entries with timestamps
 * - Invalidate on entry changes (persist, delete)
 * - Time-based expiration (default: 5 minutes)
 * - Collection-specific cache keys
 */

import localForage from 'decap-cms-lib-util/src/localForage';

import type { EntryValue } from '../valueObjects/Entry';

const CACHE_PREFIX = 'decap_entry_cache_';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  entries: EntryValue[];
  timestamp: number;
  collectionName: string;
  version: number; // For future cache format changes
}

/**
 * Generate cache key for a collection
 */
function getCacheKey(collectionName: string): string {
  return `${CACHE_PREFIX}${collectionName}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry: CacheEntry | null): boolean {
  if (!cacheEntry) {
    return false;
  }

  const now = Date.now();
  const age = now - cacheEntry.timestamp;

  return age < CACHE_EXPIRATION_MS;
}

/**
 * Get cached entries for a collection
 *
 * @param collectionName - Name of the collection
 * @returns Cached entries or null if cache miss/expired
 */
export async function getCachedEntries(collectionName: string): Promise<EntryValue[] | null> {
  try {
    const cacheKey = getCacheKey(collectionName);
    const cached = await localForage.getItem<CacheEntry>(cacheKey);

    if (cached && isCacheValid(cached)) {
      console.log(`[EntryCache] Cache HIT for collection: ${collectionName}`);
      return cached.entries;
    }

    console.log(`[EntryCache] Cache MISS for collection: ${collectionName}`);
    return null;
  } catch (error) {
    console.warn('[EntryCache] Error reading cache:', error);
    return null;
  }
}

/**
 * Store entries in cache
 *
 * @param collectionName - Name of the collection
 * @param entries - Entries to cache
 */
export async function setCachedEntries(
  collectionName: string,
  entries: EntryValue[],
): Promise<void> {
  try {
    const cacheKey = getCacheKey(collectionName);
    const cacheEntry: CacheEntry = {
      entries,
      timestamp: Date.now(),
      collectionName,
      version: 1,
    };

    await localForage.setItem(cacheKey, cacheEntry);
    console.log(`[EntryCache] Cached ${entries.length} entries for collection: ${collectionName}`);
  } catch (error) {
    console.warn('[EntryCache] Error writing cache:', error);
  }
}

/**
 * Invalidate cache for a specific collection
 *
 * Should be called when:
 * - Entry is created
 * - Entry is updated
 * - Entry is deleted
 *
 * @param collectionName - Name of the collection to invalidate
 */
export async function invalidateCollectionCache(collectionName: string): Promise<void> {
  try {
    const cacheKey = getCacheKey(collectionName);
    await localForage.removeItem(cacheKey);
    console.log(`[EntryCache] Invalidated cache for collection: ${collectionName}`);
  } catch (error) {
    console.warn('[EntryCache] Error invalidating cache:', error);
  }
}

/**
 * Clear all entry caches
 *
 * Useful for logout or manual cache clearing
 */
export async function clearAllEntryCaches(): Promise<void> {
  try {
    const keys = await localForage.keys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    await Promise.all(cacheKeys.map(key => localForage.removeItem(key)));
    console.log(`[EntryCache] Cleared ${cacheKeys.length} collection caches`);
  } catch (error) {
    console.warn('[EntryCache] Error clearing all caches:', error);
  }
}

/**
 * Get cache statistics for debugging
 */
export async function getCacheStats(): Promise<{
  collections: string[];
  totalEntries: number;
  oldestCache: number | null;
  newestCache: number | null;
}> {
  try {
    const keys = await localForage.keys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    const cacheEntries = await Promise.all(
      cacheKeys.map(async key => {
        const entry = await localForage.getItem<CacheEntry>(key);
        return entry;
      }),
    );

    const validCaches = cacheEntries.filter((entry): entry is CacheEntry => entry !== null);

    const timestamps = validCaches.map(c => c.timestamp);

    return {
      collections: validCaches.map(c => c.collectionName),
      totalEntries: validCaches.reduce((sum, c) => sum + c.entries.length, 0),
      oldestCache: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestCache: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  } catch (error) {
    console.warn('[EntryCache] Error getting cache stats:', error);
    return {
      collections: [],
      totalEntries: 0,
      oldestCache: null,
      newestCache: null,
    };
  }
}
