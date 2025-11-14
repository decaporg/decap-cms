/**
 * @jest-environment jsdom
 */

// Mock localForage - must be before imports
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockKeys = jest.fn();

jest.mock('decap-cms-lib-util/src/localForage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
    removeItem: (...args: unknown[]) => mockRemoveItem(...args),
    keys: (...args: unknown[]) => mockKeys(...args),
  },
}));

import {
  getCachedEntries,
  setCachedEntries,
  invalidateCollectionCache,
  clearAllEntryCaches,
  getCacheStats,
} from '../entryCache';

describe('entryCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log in tests
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCachedEntries', () => {
    it('should return null if cache is empty', async () => {
      mockGetItem.mockResolvedValue(null);

      const result = await getCachedEntries('posts');

      expect(result).toBeNull();
      expect(mockGetItem).toHaveBeenCalledWith('decap_entry_cache_posts');
    });

    it('should return null if cache is expired', async () => {
      const expiredCache = {
        entries: [{ slug: 'post1', data: { title: 'Post 1' } }],
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (expired)
        collectionName: 'posts',
        version: 1,
      };
      mockGetItem.mockResolvedValue(expiredCache);

      const result = await getCachedEntries('posts');

      expect(result).toBeNull();
    });

    it('should return cached entries if cache is valid', async () => {
      const entries = [{ slug: 'post1', data: { title: 'Post 1' } }];
      const validCache = {
        entries,
        timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago (valid)
        collectionName: 'posts',
        version: 1,
      };
      mockGetItem.mockResolvedValue(validCache);

      const result = await getCachedEntries('posts');

      expect(result).toEqual(entries);
    });

    it('should handle errors gracefully', async () => {
      mockGetItem.mockRejectedValue(new Error('Storage error'));

      const result = await getCachedEntries('posts');

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        '[EntryCache] Error reading cache:',
        expect.any(Error),
      );
    });
  });

  describe('setCachedEntries', () => {
    it('should store entries with timestamp', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: any[] = [{ slug: 'post1', data: { title: 'Post 1' } }];
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await setCachedEntries('posts', entries);

      expect(mockSetItem).toHaveBeenCalledWith('decap_entry_cache_posts', {
        entries,
        timestamp: now,
        collectionName: 'posts',
        version: 1,
      });
    });

    it('should handle errors gracefully', async () => {
      mockSetItem.mockRejectedValue(new Error('Storage error'));

      await setCachedEntries('posts', []);

      expect(console.warn).toHaveBeenCalledWith(
        '[EntryCache] Error writing cache:',
        expect.any(Error),
      );
    });
  });

  describe('invalidateCollectionCache', () => {
    it('should remove cache for collection', async () => {
      await invalidateCollectionCache('posts');

      expect(mockRemoveItem).toHaveBeenCalledWith('decap_entry_cache_posts');
    });

    it('should handle errors gracefully', async () => {
      mockRemoveItem.mockRejectedValue(new Error('Storage error'));

      await invalidateCollectionCache('posts');

      expect(console.warn).toHaveBeenCalledWith(
        '[EntryCache] Error invalidating cache:',
        expect.any(Error),
      );
    });
  });

  describe('clearAllEntryCaches', () => {
    it('should clear all entry caches', async () => {
      mockKeys.mockResolvedValue([
        'decap_entry_cache_posts',
        'decap_entry_cache_pages',
        'other_key',
      ]);

      await clearAllEntryCaches();

      expect(mockRemoveItem).toHaveBeenCalledTimes(2);
      expect(mockRemoveItem).toHaveBeenCalledWith('decap_entry_cache_posts');
      expect(mockRemoveItem).toHaveBeenCalledWith('decap_entry_cache_pages');
      expect(mockRemoveItem).not.toHaveBeenCalledWith('other_key');
    });

    it('should handle errors gracefully', async () => {
      mockKeys.mockRejectedValue(new Error('Storage error'));

      await clearAllEntryCaches();

      expect(console.warn).toHaveBeenCalledWith(
        '[EntryCache] Error clearing all caches:',
        expect.any(Error),
      );
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const now = Date.now();
      mockKeys.mockResolvedValue([
        'decap_entry_cache_posts',
        'decap_entry_cache_pages',
        'other_key',
      ]);
      mockGetItem
        .mockResolvedValueOnce({
          entries: [{ slug: 'post1' }, { slug: 'post2' }],
          timestamp: now - 1000,
          collectionName: 'posts',
          version: 1,
        })
        .mockResolvedValueOnce({
          entries: [{ slug: 'page1' }],
          timestamp: now - 2000,
          collectionName: 'pages',
          version: 1,
        })
        .mockResolvedValueOnce(null);

      const stats = await getCacheStats();

      expect(stats).toEqual({
        collections: ['posts', 'pages'],
        totalEntries: 3,
        oldestCache: now - 2000,
        newestCache: now - 1000,
      });
    });

    it('should handle empty cache', async () => {
      mockKeys.mockResolvedValue([]);

      const stats = await getCacheStats();

      expect(stats).toEqual({
        collections: [],
        totalEntries: 0,
        oldestCache: null,
        newestCache: null,
      });
    });

    it('should handle errors gracefully', async () => {
      mockKeys.mockRejectedValue(new Error('Storage error'));

      const stats = await getCacheStats();

      expect(stats).toEqual({
        collections: [],
        totalEntries: 0,
        oldestCache: null,
        newestCache: null,
      });
      expect(console.warn).toHaveBeenCalledWith(
        '[EntryCache] Error getting cache stats:',
        expect.any(Error),
      );
    });
  });
});
