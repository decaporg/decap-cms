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
