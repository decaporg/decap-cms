---
title: GitHub
weight: 20
group: accounts
---

For repositories stored on GitHub, the `github` backend allows CMS users to log in directly with their GitHub account. Note that all users must have push access to your content repository for this to work.

Because Github [requires a server](https://github.com/netlify/netlify-cms/issues/663#issuecomment-335023723) for authentication, Netlify facilitates basic GitHub authentication.

To enable basic GitHub authentication:

1. Follow the authentication provider setup steps in the [Netlify docs](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider).
2. Add the following lines to your Netlify CMS `config.yml` file:

```yaml
backend:
  name: github
  repo: owner-name/repo-name # Path to your GitHub repository
```

## Specifying a status for deploy previews

The GitHub backend supports [deploy preview links](../deploy-preview-links). Netlify CMS checks the
`context` of a commit's [statuses](https://help.github.com/articles/about-status-checks/) and infers
one that seems to represent a deploy preview. If you need to customize this behavior, you can
specify which context to look for using `preview_context`:

```yaml
backend:
  name: github
  repo: my/repo
  preview_context: my-provider/deployment
```

The above configuration would look for the status who's `"context"` is `"my-provider/deployment"`.
