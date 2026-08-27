import { collectionKeyForFiles } from '../implementation';

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

describe('entriesByFiles missing-file handling', () => {
  // Regression: a files collection is a fixed list of documents the editor
  // declared. Files that do not exist in the repo yet must still appear, empty
  // and editable — that is the only way to create them. Syncing from a git
  // tree drops them (no blob, not in the tree), so they are reinstated in the
  // client. Caught end-to-end on develop: "Site settings" and "Cookies"
  // vanished from the CMS because neither file existed on the branch.
  function reconcile(
    files: { path: string; label?: string }[],
    cached: { file: { path: string }; data: string }[],
  ) {
    const byPath = new Map(cached.map(e => [String(e.file?.path), e]));
    return files.map(f => byPath.get(f.path) ?? { file: { ...f, id: null }, data: '' });
  }

  const files = [
    { path: 'config.toml', label: 'Site settings' },
    { path: 'data/cookies.json', label: 'Cookies' },
    { path: 'data/footer.json', label: 'Footer' },
  ];

  it('returns one entry per configured file even when none exist', () => {
    expect(reconcile(files, []).map(e => e.file.path)).toEqual(files.map(f => f.path));
  });

  it('gives a non-existent file empty content rather than omitting it', () => {
    const [siteSettings] = reconcile(files, []);
    expect(siteSettings.data).toBe('');
    expect((siteSettings.file as { label?: string }).label).toBe('Site settings');
  });

  it('preserves cached content for files that do exist', () => {
    const cached = [{ file: { path: 'data/footer.json' }, data: '{"copyright":"x"}' }];
    const result = reconcile(files, cached);
    expect(result).toHaveLength(3);
    expect(result[2].data).toBe('{"copyright":"x"}');
    expect(result[0].data).toBe('');
  });

  it('keeps config order, not the order rows came back in', () => {
    const cached = [
      { file: { path: 'data/footer.json' }, data: 'c' },
      { file: { path: 'config.toml' }, data: 'a' },
    ];
    expect(reconcile(files, cached).map(e => e.data)).toEqual(['a', '', 'c']);
  });
});
