---
title: Gitea
group: Accounts
weight: 25
---

For repositories stored on Gitea, the `gitea` backend allows CMS users to log in directly with their Gitea account. Note that all users must have push access to your content repository for this to work.

Please note that only Gitea **1.20** and upwards is supported due to API limitations in previous versions.

## Authentication

With Gitea's PKCE authorization, users can authenticate with Gitea directly from the client. To do this:

1. Add your Decap CMS instance as an OAuth application in your user/organization settings or through the admin panel of your Gitea instance. Please make sure to uncheck the **Confidential Client** checkbox. For the **Redirect URIs**, enter the addresses where you access Decap CMS, for example, `https://www.mysite.com/admin/`.
2. Gitea provides you with a **Client ID**. Copy it and insert it into your `config` file along with the other options:

```yaml
backend:
  name: gitea
  repo: owner-name/repo-name # Path to your Gitea repository
  app_id: your-client-id # The Client ID provided by Gitea
  api_root: https://gitea.example.com/api/v1 # API URL of your Gitea instance
  base_url: https://gitea.example.com # Root URL of your Gitea instance
  # optional, defaults to master
  # branch: main
```

## Git Large File Storage (LFS)

Please note that the Gitea backend **does not** support [git-lfs](https://git-lfs.github.com/).
