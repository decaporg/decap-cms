import { collectionKeyForFiles } from '../backendUtil';

describe('collectionKeyForFiles', () => {
  it('is stable for the same set of paths', () => {
    expect(collectionKeyForFiles(['a.md', 'b.md'])).toBe(collectionKeyForFiles(['a.md', 'b.md']));
  });

  it('does not depend on the order the paths arrive in', () => {
    // Reordering files in config.yml must not orphan the cached rows.
    expect(collectionKeyForFiles(['b.md', 'a.md'])).toBe(collectionKeyForFiles(['a.md', 'b.md']));
  });

  it('changes when a file is added', () => {
    expect(collectionKeyForFiles(['a.md'])).not.toBe(collectionKeyForFiles(['a.md', 'b.md']));
  });

  it('changes when a file is swapped for a different one', () => {
    expect(collectionKeyForFiles(['a.md'])).not.toBe(collectionKeyForFiles(['b.md']));
  });

  it('stays short even for a large collection', () => {
    // The key lands in every row's `collections` array; the largest live files
    // collection is 77 paths, which as a raw join would be ~2 KB per row.
    const key = collectionKeyForFiles(Array.from({ length: 77 }, (_, i) => `data/file-${i}.json`));
    expect(key.length).toBeLessThan(32);
    expect(key.startsWith('files:77:')).toBe(true);
  });

  it('is namespaced so it cannot collide with a folder collection key', () => {
    expect(collectionKeyForFiles(['a.md']).startsWith('files:')).toBe(true);
  });
});
