# Decap CMS — Turbo Backend

**This backend is under active development.**

This package replaces the standard GitHub OAuth flow with Supabase email/password authentication, and adds a Supabase-backed cache that makes large-collection entry loading significantly faster.

## Architecture

The backend is built in two layers.

### 1. Auth layer (`implementation.tsx`)

Users sign in with their email and password via a custom login page. Authentication is handled entirely by Supabase Auth — no GitHub OAuth app or personal access token is required from the user. After login, the Supabase JWT is used as a Bearer token for all GitHub API calls, which are proxied through Supabase.

The implementation also handles token refresh automatically: if the Supabase JWT is close to expiry it is silently refreshed in the background, and the updated tokens are persisted back to the Decap CMS auth store.

### 2. DB cache layer (`supabase.ts`)

For folder collections, entry data is mirrored into a Supabase table. The flow on every collection load is:

1. Fetch the file list from GitHub.
2. Diff it against the cached rows in Supabase.
3. Remove stale rows; insert any missing rows in batches.
4. Return entries from Supabase, filtered by `repo`, `site_id`, `branch`, and `collection`.

Each cached row is keyed by:

| column | description |
|---|---|
| `repo` | GitHub repository (`owner/repo`) |
| `site_id` | identifies which site owns the row when multiple sites share one Supabase project |
| `branch` | Git branch |
| `collection` | folder + extension + depth fingerprint |
| `file_id` | Git blob SHA |

## Decap CMS config

```yaml
backend:
  name: decap-turbo
  repo: owner/repo
  branch: main

  # Stable identifier for this site.
  turbo_site_id: your-site-id
```

`supabase_app_id`, `supabase_anon_key`, `base_url`, and `api_root` are
identical across every site on the shared control plane, so they don't
need to be copied into each site's `config.yml` by hand. This package's
`DecapTurboBackend` class implements a static `preloadConfig(config)` hook
— a generic extension point in Decap CMS core
(`packages/decap-cms-core/src/actions/config.ts`): core has no built-in
knowledge of Turbo or Supabase, it just awaits whatever `preloadConfig`
the registered backend class provides, before constructing the backend.
Here, `preloadConfig` fetches the site's config from the control plane's
`config` endpoint (`site_id` in the query string) and merges the response
into `backend`.

An optional `turbo_config_url` field can override which endpoint is
queried, for a control plane other than the default shared one:

```yaml
backend:
  name: decap-turbo
  repo: owner/repo
  branch: main
  turbo_site_id: your-site-id
  turbo_config_url: https://your-control-plane.example/functions/v1/config
```

To skip the fetch entirely — e.g. for local/offline development — specify
`supabase_app_id` (or all of the fields) explicitly instead:

```yaml
backend:
  name: decap-turbo
  repo: owner/repo
  branch: main

  # Full Supabase project URL — used by the auth page and token refresh.
  base_url: https://your-project-ref.supabase.co
  api_root: https://your-project-ref.supabase.co/functions/v1/gh

  # Supabase project ref — used to build the PostgREST endpoint for the cache.
  supabase_app_id: your-project-ref

  # Supabase anon key — used for both auth API calls and cache queries.
  supabase_anon_key: your-supabase-anon-key

  # Stable identifier for this site.
  turbo_site_id: your-site-id
```

Any field present in `config.yml` always wins over a fetched default.

## Supabase setup

### Auth

Enable the **Email** provider in your Supabase project under Authentication → Providers. Create an account for each CMS user.

### Cache table

Create a table named `data` in the `public` schema:

```sql
create table public.data (
  id            bigserial primary key,
  repo          text not null,
  site_id       text not null,
  branch        text not null,
  collection    text not null,
  file_id       text not null,
  file_path     text not null,
  file_meta     jsonb not null,
  file_data     text
);

create unique index data_identity_idx
  on public.data (repo, site_id, branch, collection, file_id);
```

The unique index is required for the upsert merge resolution used by batch inserts.

Make sure the anon role has `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `public.data`, or configure an appropriate RLS policy.
