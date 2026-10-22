# Decap CMS — Turbo GitHub Backend

`turbo-github` connects Decap CMS to [Decap Turbo](https://decapcms.org/docs/turbo-overview/). Content stays in your GitHub repository and every save is a commit, as with the `github` backend, but editors sign in with a Turbo account instead of a GitHub account, and GitHub is reached through Turbo's server-side proxy, which also caches the repository's content.

It extends `GitHubBackend` from `decap-cms-backend-github`. Anything not overridden here, including branching and the pull-request-based editorial workflow, behaves as it does there. The GitLab twin is [`decap-cms-backend-turbo-gitlab`](../decap-cms-backend-turbo-gitlab); code the two share lives in [`decap-cms-lib-turbo`](../decap-cms-lib-turbo).

Product documentation: [overview](https://decapcms.org/docs/turbo-overview/), [getting started](https://decapcms.org/docs/turbo-getting-started/), [connecting a site](https://decapcms.org/docs/turbo-connecting-a-site/), [roles and members](https://decapcms.org/docs/turbo-roles-and-members/), [deploy status](https://decapcms.org/docs/turbo-deploy-status/), [CLI and agents](https://decapcms.org/docs/turbo-cli-and-agents/).

## Configuration

The backend is registered in the `decap-cms` and `decap-cms-app` bundles. [Create a site](https://decapcms.org/docs/turbo-getting-started/) in Turbo, then:

```yaml
backend:
  name: turbo-github
  turbo_site_id: your-site-id
```

`turbo_site_id` is the only required key. Before the backend is constructed, its static `preloadConfig` hook fetches the rest from Turbo's `config` endpoint (Supabase project, anon key, `base_url`, `api_root`, `repo` and the default `branch`) and merges it into `backend`. Values in `config.yml` win, with one exception: `repo` always comes from the site in Turbo, because the proxy checks permissions against it.

| Optional key | |
|---|---|
| `branch` | Branch to edit. Defaults to the site's branch in Turbo. Set it to let one site back several deploys of the same repo. |
| `deploy_status` | `false`, or an object with `notifications`, `page` and `primary_target`. See [deploy status](https://decapcms.org/docs/turbo-deploy-status/). |
| `editor_bridge` | `true` turns on the experimental [editor bridge](#editor-bridge). Off by default. |

`use_graphql: true` is not supported and throws in the constructor: the GraphQL client builds its own transport, which would skip the per-site scoping (`x-site-id` header and `site_id` parameter) the proxy relies on.

### Escape hatches

For running against a self-hosted control plane or working offline. The hosted product never needs them.

| Key | |
|---|---|
| `turbo_config_url` | Config endpoint to fetch from, instead of `https://sb.decapcms.org/functions/v1/config`. |
| `turbo_admin_url` | Turbo app that serves the login popup. Default `https://turbo.decapcms.org`. |
| `supabase_app_id`, `supabase_anon_key` | Supabase project ref and anon key. The ref builds the auth and content cache URLs (`https://<ref>.supabase.co`). Setting both skips the fetch entirely, so `base_url`, `api_root` and `repo` must then be set too. Setting `supabase_app_id` alone throws. |
| `base_url` | Supabase project URL, for the `permissions` and `telemetry` functions, deploy status, the editor bridge and media libraries. |
| `api_root` | The `gh` proxy function, `<base_url>/functions/v1/gh`. |

## How it works

### Login

"Login with Turbo" opens a popup on `turbo_admin_url`. The Turbo app sends the resulting Supabase session back with `postMessage`, and `AuthenticationPage.js` accepts it only when `event.origin` equals the origin of `turbo_admin_url`. That check is the security boundary of the flow and must never be relaxed. Links from the Turbo profile page carry a one-time code in the URL hash instead, which is redeemed for the session with a POST to the Turbo app's `/auth/exchange`.

A session Turbo minted for this CMS alone is revoked server-side on logout. An older session shared with the Turbo dashboard is left alone, so logging out of one CMS does not sign the user out of Turbo.

### Requests and token refresh

The Supabase access token is sent as a Bearer token to the `gh` proxy, which calls GitHub with the organization's GitHub App installation token. The CMS never holds a GitHub token.

The access token is refreshed before it expires, with retries for transient failures. Supabase refresh tokens are single-use, so refreshes take a lock shared by every tab on the origin, and a tab adopts a session another tab already rotated. A terminal refresh failure, or a 401 from the proxy that one forced refresh cannot fix, ends the session with "Session expired. Please log in again." A 403 because the user is not a member of the site fails the login, or ends the session if it arrives later.

### Content cache

Turbo's server owns the cache. For each folder or files collection the backend calls `_content/sync`, which brings the cache up to the branch's current head, and reads the entries from `public.data` through PostgREST. The browser has read access only. Locale files of `multiple_files` i18n collections are synced in the background. Opening a single entry checks the cached row with `_content/entry` and reads from GitHub when it is stale.

Saves go through `_content/commit`: one request that commits and updates the cache. Renames, saves to an entry already in editorial review, open authoring, and requests the endpoint refuses with 400, 404 or 413 fall back to the inherited REST sequence.

### Permissions

After login the backend fetches the user's per-collection permissions from the `permissions` function and attaches them to the user as `permissions.collections` (`edit`, `view` or `none`). Core hides `none` collections for any backend whose user carries that field. This is a UI convenience; the proxy enforces permissions on every request.

### Commit attribution

Commits are authored by the Turbo GitHub App. The proxy adds the editor in a `Co-authored-by` trailer, derived from the session rather than from anything the browser sends.

### Deploy status

After a save, the backend polls Turbo's `site_deployments` for a successful deploy whose commit contains the save, and tells the editor when the change is live. If nothing reports a deploy for the branch within two minutes, it stops silently. `deploy_status` turns the notifications and the Deploys page off.

### Telemetry

The backend sends `cms_session_started` and `cms_entry_saved` to Turbo's `telemetry` function. The call is not awaited and swallows its own errors, so it cannot affect editing. Editors opt out of analytics on their Turbo profile, owners for the whole organization in its settings. Opting out is applied server-side; the save event that feeds the organization's Activity log is still recorded.

### Editor bridge

With `editor_bridge: true`, the entry open in the CMS is synced to Turbo every few seconds, so an agent using [`decap mcp`](../decap) can propose field changes. They appear highlighted in the editor and are saved only when the editor saves. The bridge also adds an "Ask Claude" action beside each field and an "Agent bridge on" badge, whose × turns it off for the tab. It is experimental and may change.
