# Decap CMS — Turbo GitLab Backend

**This backend is under active development.**

`turbo-gitlab` is a Decap CMS backend that still stores content as files in a GitLab repo (like `decap-cms-backend-gitlab`), but changes two things about how the CMS talks to GitLab:

1. **Auth**: instead of a GitLab OAuth app or personal access token, users sign in through a hosted Supabase-backed login flow. No GitLab account is required for CMS users at all — GitLab API calls are made by a Supabase Edge Function on their behalf, using their Supabase session as the credential.
2. **Speed for large folder collections**: instead of listing and reading every file in a folder collection from the GitLab API on every load, entries are mirrored into a Postgres table (via Supabase's PostgREST API) and served from there. This is the difference between a few GitLab API calls and hundreds/thousands of them for a collection with many entries.

It's built as a subclass of `GitLabBackend` (`decap-cms-backend-gitlab`) — everything not explicitly overridden (branching, MR-based editorial workflow, media handling, etc.) behaves exactly like the GitLab backend. See `decap-cms-backend-turbo-github`'s README for the GitHub-flavored twin of this backend — the two share the same control-plane design and config scheme.

## Architecture

The backend is built in three parts.

### 1. Auth layer (`implementation.tsx`, `AuthenticationPage.js`)

Clicking "Login with Turbo" opens a popup pointed at a hosted Turbo admin app (`turbo_admin_url`, default `https://turbo.decapcms.org`), where the user authenticates with Supabase Auth. On success, the popup `postMessage`s the resulting Supabase session (access/refresh tokens, expiry, user metadata) back to the CMS tab; `AuthenticationPage.js` validates the message's `event.origin` against the admin app's origin before accepting it — this origin check is the flow's whole security boundary and must not be weakened.

Once authenticated, the Supabase access token (a JWT) is used as a Bearer token for all GitLab API calls, which are routed through a Supabase Edge Function (`api_root`, typically `.../functions/v1/gl`) that proxies them to the real GitLab API using a server-side group/project access token. The CMS never sees a GitLab token. Because there's no real GitLab identity for the CMS user, `currentUser` synthesizes a user object from the repo owner rather than calling GitLab's user endpoint.

Token refresh is automatic: `implementation.tsx` tracks the JWT's expiry and silently refreshes it in the background (with retry/backoff for transient failures) before it expires, persisting the new tokens back to the Decap CMS auth store via `updateUserCredentials`. A terminal failure (expired/invalid refresh token) forces a logout with a clear message; a transient failure (network blip, 5xx) does not.

`commitAuthor.ts` derives the Git commit author (name + email) from the Supabase user's metadata/email, so commits are attributed to the actual CMS user rather than a shared service account.

### 2. DB cache layer (`supabase.ts`)

For folder collections, entry data is mirrored into a single Supabase table (`public.data`), queried directly via PostgREST rather than through the GitLab proxy. The flow on every collection load (`allEntriesByFolder`) is:

1. List the folder's files from GitLab (as the GitLab backend normally would).
2. Diff that list against the cached rows for this collection in Supabase (`validateFiles`): remove rows for files that no longer exist, and read + insert (in batches) any files missing from the cache.
3. Return entries from Supabase, filtered by `repo`, `site_id`, `branch`, and `collection`, re-sorted to match the GitLab listing's order.

A successful `persistEntry` (save) also pushes the new content straight into the cache (`updateEntriesAfterSave`), so a save is immediately reflected without waiting for the next full diff.

Each cached row is keyed by:

| column | description |
|---|---|
| `repo` | GitLab project path (`owner/repo`) |
| `site_id` | identifies which site owns the row when multiple sites share one Supabase project |
| `branch` | Git branch |
| `collection` | a fingerprint of `folder:extension:depth:pathRegex` — i.e. two different folder-collection configs never share cache rows, even if they'd otherwise match the same file |
| `file_id` | Git blob SHA (used to detect changed content) |
| `file_path` | path of the file within the repo |

The upsert conflict target for batch inserts (`site_id, repo, branch, collection, file_path`) must always match the DB's unique index — see [Cache table](#cache-table) below. If they drift apart, batch upserts fail outright. This is the same `public.data` table `decap-cms-backend-turbo-github` uses — both backends can share one Supabase project.

### 3. Permissions (optional, cross-package)

After authentication, the backend fetches per-collection permissions for the signed-in user from the control plane's `permissions` endpoint (`fetchTurboPermissions`) and attaches them to the resolved user object as a generic `permissions.collections` map (`{ [collectionName]: 'edit' | 'view' | 'none' }`). This isn't Turbo-specific plumbing in `decap-cms-core` — core just knows that *any* backend's authenticated user may carry a `permissions` field, and if it does, `actions/auth.ts` re-filters the already-loaded config to drop collections resolved to `'none'` (`actions/config.ts`: `applyBackendPermissionFilter` / `refilterConfigForPermissions`). A backend that never sets `permissions` is entirely unaffected.

This is a UX / defense-in-depth layer only — it hides collections the user shouldn't see, nothing more. The real enforcement boundary is server-side, in the `gl` Edge Function that proxies writes; nothing client-side should be relied on as the sole access control.

### 4. Usage telemetry (`telemetry.ts`)

After a session starts and after each entry save, the backend fires a
best-effort, non-blocking event (`cms_session_started` / `cms_entry_saved`) to
the control plane's `telemetry` Edge Function. This call is never awaited by
its callers and swallows its own errors — a failed or slow telemetry request
can never disrupt the editing experience.

Users can opt out from the Turbo admin app's Profile page.

## Decap CMS config

```yaml
backend:
  name: turbo-gitlab
  repo: owner/repo
  branch: main

  # Stable identifier for this site.
  turbo_site_id: your-site-id
```

`supabase_app_id`, `supabase_anon_key`, `base_url`, and `api_root` are
identical across every site on the shared control plane, so they don't
need to be copied into each site's `config.yml` by hand. This package's
`DecapTurboGitLabBackend` class implements a static `preloadConfig(config)` hook
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
  name: turbo-gitlab
  repo: owner/repo
  branch: main
  turbo_site_id: your-site-id
  turbo_config_url: https://your-control-plane.example/functions/v1/config
```

To skip the fetch entirely — e.g. for local/offline development — specify
**both** `supabase_app_id` and `supabase_anon_key` explicitly instead. Setting
only one of the two is a config error and `preloadConfig` will throw rather
than silently running with a broken key:

```yaml
backend:
  name: turbo-gitlab
  repo: owner/repo
  branch: main

  # Full Supabase project URL — used by the auth page and token refresh.
  base_url: https://your-project-ref.supabase.co
  api_root: https://your-project-ref.supabase.co/functions/v1/gl

  # Supabase project ref — used to build the PostgREST endpoint for the cache.
  supabase_app_id: your-project-ref

  # Supabase anon key — used for both auth API calls and cache queries.
  supabase_anon_key: your-supabase-anon-key

  # Stable identifier for this site.
  turbo_site_id: your-site-id
```

Any field present in `config.yml` always wins over a fetched default.

`use_graphql: true` (inherited from the base GitLab backend) is not
supported and throws in the constructor, for the same reason as
`decap-cms-backend-turbo-github`: a GraphQL transport would bypass the
`x-site-id`/`site_id` scoping this backend adds on top of every REST
request, which the shared `gl` Edge Function relies on to know which
tenant a request belongs to.

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
  on public.data (site_id, repo, branch, collection, file_path);
```

The unique index must cover exactly `(site_id, repo, branch, collection, file_path)` — that's the `on_conflict` target the batch upsert targets in `supabase.ts`. It's keyed on `file_path` rather than `file_id` so that saving new content for an existing path replaces its cached row instead of inserting a duplicate.

Make sure the anon role has `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `public.data`, or configure an appropriate RLS policy.

If you're already running `decap-cms-backend-turbo-github` against the same Supabase project, this table is shared — no separate table is needed for GitLab sites.
