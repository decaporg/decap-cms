import type { Config } from 'decap-cms-lib-util';

// Control-plane values are the same for every site, so a config.yml only needs
// `turbo_site_id`; core awaits the backend's static `preloadConfig` hook.
const DEFAULT_CONFIG_ENDPOINT = 'https://sb.decapcms.org/functions/v1/config';
const DEFAULT_TURBO_ADMIN_URL = 'https://turbo.decapcms.org';

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
    const { repo, branch, ...otherDefaults } = defaults as Record<string, unknown> & {
      repo?: string | null;
      branch?: string;
    };

    // A site can be created before a repo is chosen for it. The proxies only
    // serve sites.repo, so a repo in config.yml cannot stand in for it, and
    // without this the git backend's own "needs a repo" error blames config.yml.
    if ('repo' in defaults && !repo) {
      let adminUrl = (backend.turbo_admin_url as string) || DEFAULT_TURBO_ADMIN_URL;
      while (adminUrl.endsWith('/')) adminUrl = adminUrl.slice(0, -1);
      throw new Error(
        `${backendName} config error: this Decap Turbo site has no repository set. ` +
          `Set "Repo" on the site's page in the Turbo dashboard: ` +
          `${adminUrl}/sites/${encodeURIComponent(backend.turbo_site_id as string)}`,
      );
    }

    return {
      ...config,
      backend: {
        ...otherDefaults,
        ...config.backend,
        // `repo` comes from the sites row: the proxy checks permissions against
        // it, so a stale config.yml value 403s.
        ...(repo ? { repo } : {}),
        // `branch` is the opposite: one site can serve several deploys of the
        // repo, each naming its branch in config.yml; the row is the default.
        ...(branch && !config.backend.branch ? { branch } : {}),
      },
    };
  };
}
