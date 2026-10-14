import { createPreloadConfig } from '../preloadConfig';

describe('createPreloadConfig', () => {
  const preloadConfig = createPreloadConfig('turbo-github');

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('returns the config unchanged when fully manually configured', async () => {
    const config = {
      backend: { supabase_app_id: 'app-id', supabase_anon_key: 'anon-key' },
    } as any;

    await expect(preloadConfig(config)).resolves.toBe(config);
  });

  it('throws, naming the backend, when supabase_app_id is set without supabase_anon_key', async () => {
    const config = { backend: { supabase_app_id: 'app-id' } } as any;

    await expect(preloadConfig(config)).rejects.toThrow(
      /turbo-github config error: 'supabase_app_id' is set without 'supabase_anon_key'/,
    );
  });

  it('returns the config unchanged when nothing is configured at all', async () => {
    const config = { backend: {} } as any;

    await expect(preloadConfig(config)).resolves.toBe(config);
  });

  it('fetches and merges control-plane defaults when only turbo_site_id is set', async () => {
    const config = { backend: { turbo_site_id: 'site-123', repo: 'owner/repo' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ supabase_app_id: 'resolved-app-id', supabase_anon_key: 'resolved-key' }),
    } as any);

    const actual = await preloadConfig(config);

    expect(actual.backend).toEqual({
      supabase_app_id: 'resolved-app-id',
      supabase_anon_key: 'resolved-key',
      turbo_site_id: 'site-123',
      repo: 'owner/repo',
    });
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://sb.decapcms.org/functions/v1/config?site_id=site-123');
  });

  it('asks the endpoint config.yml names instead of the default', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', turbo_config_url: 'https://sb.example/config' },
    } as any;
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as any);

    await preloadConfig(config);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'https://sb.example/config?site_id=site-123',
    );
  });

  it('throws, naming the backend, when the control-plane config endpoint fails', async () => {
    const config = { backend: { turbo_site_id: 'site-123' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'site not found' }),
    } as any);

    await expect(preloadConfig(config)).rejects.toThrow(
      'Failed to load turbo-github site defaults: site not found',
    );
  });

  it("overrides a stale local repo with the control plane's value", async () => {
    const config = { backend: { turbo_site_id: 'site-123', repo: 'stale/repo' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'owner/repo',
          branch: 'main',
        }),
    } as any);

    const actual = await preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
  });

  // One sites row serves every deploy of a repo, so its branch cannot be the
  // one a staging deploy edits; the deploy's own config.yml says which branch
  // it is on.
  it('keeps the branch from config.yml over the control plane branch', async () => {
    const config = { backend: { turbo_site_id: 'site-123', branch: 'develop' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'owner/repo',
          branch: 'main',
        }),
    } as any);

    const actual = await preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
    expect(actual.backend.branch).toBe('develop');
  });

  it('fills in repo/branch from the control plane when config.yml omits them', async () => {
    const config = { backend: { turbo_site_id: 'site-123' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'owner/repo',
          branch: 'main',
        }),
    } as any);

    const actual = await preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
    expect(actual.backend.branch).toBe('main');
  });

  // The git backend's own error would blame config.yml for a missing `repo`.
  it('throws, pointing at the dashboard, when the site has no repo set', async () => {
    const config = { backend: { turbo_site_id: 'site-123', repo: 'owner/repo' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: null,
          branch: 'main',
        }),
    } as any);

    await expect(preloadConfig(config)).rejects.toThrow(
      'turbo-github config error: this Decap Turbo site has no repository set. ' +
        `Set "Repo" on the site's page in the Turbo dashboard: https://turbo.decapcms.org/sites/site-123`,
    );
  });

  it('links the no-repo error to the dashboard config.yml names', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', turbo_admin_url: 'https://turbo.example/' },
    } as any;
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ repo: null }) } as any);

    await expect(preloadConfig(config)).rejects.toThrow('https://turbo.example/sites/site-123');
  });

  it('leaves local repo/branch alone when the control plane does not return them', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', repo: 'owner/repo', branch: 'main' },
    } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ supabase_app_id: 'resolved-app-id', supabase_anon_key: 'resolved-key' }),
    } as any);

    const actual = await preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
    expect(actual.backend.branch).toBe('main');
  });
});
