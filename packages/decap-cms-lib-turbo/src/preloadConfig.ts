import type { Config } from 'decap-cms-lib-util';

// Shared control-plane values (supabase_app_id, supabase_anon_key, base_url,
// api_root) are identical across every site, so a site's config.yml only
// needs `turbo_site_id`. This is resolved here, in the backend's own code,
// rather than in decap-cms-core — core has no knowledge of Supabase or Turbo
// at all; it just awaits the backend's static `preloadConfig` hook (a generic
// extension point) before constructing the backend.
const DEFAULT_CONFIG_ENDPOINT = 'https://sb.decapcms.org/functions/v1/config';

/** The static `preloadConfig` hook for the backend registered as `backendName`. */
export function createPreloadConfig(backendName: string) {
  return async function preloadConfig(config: Config): Promise<Config> {
    const backend = config.backend as Record<string, unknown>;
    const isFullyManuallyConfigured = Boolean(backend.supabase_app_id && backend.supabase_anon_key);
    if (isFullyManuallyConfigured) {
      return config;
    }

    if (backend.supabase_app_id && !backend.supabase_anon_key) {
      // Half-manual config: `supabase_app_id` alone is not a usable anon key,
      // so failing loudly here beats the constructor silently falling back
      // to treating the project ref as the anon key.
      throw new Error(
        `${backendName} config error: 'supabase_app_id' is set without 'supabase_anon_key'. ` +
          "Provide both to configure manually, or provide only 'turbo_site_id' to fetch " +
          'both from the control plane.',
      );
    }

    if (!backend.turbo_site_id) {
      // Nothing to resolve and nothing manually configured.
      return config;
    }

    const endpoint = (backend.turbo_config_url as string) || DEFAULT_CONFIG_ENDPOINT;
    const response = await fetch(
      `${endpoint}?site_id=${encodeURIComponent(backend.turbo_site_id as string)}`,
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        `Failed to load ${backendName} site defaults: ${body.error || response.status}`,
      );
    }

    const defaults = await response.json();
    // The config endpoint returns them as JSON strings; typing them here keeps
    // the spread below assignable to the backend config's `repo`/`branch`.
    const { repo, branch, ...otherDefaults } = defaults as Record<string, unknown> & {
      repo?: string;
      branch?: string;
    };

    return {
      ...config,
      backend: {
        ...otherDefaults,
        ...config.backend,
        // `repo` is authoritative from the sites row, not config.yml: the
        // proxy resolves permissions from sites.repo, so a stale local value
        // here is exactly what makes checkRepoScope 403 with "requested repo
        // does not match".
        ...(repo ? { repo } : {}),
        // `branch` is the opposite: one sites row legitimately serves several
        // deploys of the same repo (a production site on `main`, a staging
        // site on `develop`), and each deploy says which branch it edits in
        // its own config.yml. The proxy takes the branch per request — the
        // content cache is keyed by (site, repo, branch) — so config.yml wins
        // whenever it names one, and the sites row is only the default for a
        // config.yml that leaves it out.
        ...(branch && !config.backend.branch ? { branch } : {}),
      },
    };
  };
}
