# Decap CMS — Turbo GitLab Backend

`turbo-gitlab` connects Decap CMS to [Decap Turbo](https://decapcms.org/docs/turbo-overview/) for a repository on GitLab.com. It extends `GitLabBackend` from `decap-cms-backend-gitlab` the same way [`decap-cms-backend-turbo-github`](../decap-cms-backend-turbo-github) extends the GitHub backend, and shares its design, its config keys and the code in [`decap-cms-lib-turbo`](../decap-cms-lib-turbo). Read that README for login, token refresh, the content cache, permissions, telemetry and the editor bridge. This one lists only the differences.

```yaml
backend:
  name: turbo-gitlab
  turbo_site_id: your-site-id
```

## Differences from `turbo-github`

- **Git access.** The `gl` proxy calls GitLab with the organization's GitLab connection: an OAuth token of the GitLab user who authorized it in Turbo. That token reaches every project the user can reach, so the organization's Turbo-side repo scope is the only per-project limit. See [connect your Git provider](https://decapcms.org/docs/turbo-getting-started/#connect-your-git-provider).
- **Editorial workflow** uses merge requests, as in `decap-cms-backend-gitlab`.
- **`currentUser` is synthesized.** There is no GitLab identity for the editor, so the user object is built locally from the Turbo session: `name`, `email` and avatar are the editor's, `username` is the repo owner, `id` is `0`. The backend never calls GitLab's user endpoint.
- **Saves** go through GitLab's commits API, which already commits in one call, so there is no `_content/commit`. The cache picks the change up on the next `_content/sync`.
- **Commit attribution.** The editor is the commit author (`author_name`, `author_email`); the committer is the GitLab user behind the connection.
- **No deploy status.** `deploy_status` has no effect.
- **Escape hatch `api_root`** points at the `gl` function, `<base_url>/functions/v1/gl`.
- **`use_graphql: true`** throws, for the same reason as on GitHub.
