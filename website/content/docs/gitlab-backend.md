---
title: GitLab
group: backends
weight: 20
---
For repositories stored on GitLab, the `gitlab` backend allows CMS users to log in directly with their GitLab account. Note that all users must have push access to your content repository for this to work.

**Note:** GitLab default branch is protected by default, thus typically requires `maintainer` permissions in order for users to have push access.

The GitLab API allows for two types of OAuth2 flows:

* [Web Application Flow](https://docs.gitlab.com/ce/api/oauth2.html#web-application-flow), which works much like the GitHub OAuth flow described above.
* [Implicit Grant](https://docs.gitlab.com/ce/api/oauth2.html#implicit-grant-flow), which operates *without* the need for an authentication server.

## Web Application Flow with Netlify

When using GitLab's Web Application Flow for authentication, you can use Netlify to handle the server-side authentication requests.

To enable it:

1. Follow the [GitLab docs](https://docs.gitlab.com/ee/integration/oauth_provider.html#adding-an-application-through-the-profile) to add your Netlify CMS instance as an OAuth application. For the **Redirect URI**, enter `https://api.netlify.com/auth/done`, and check the box for `api` scope.
2. Follow the [Netlify docs](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider) to add your new GitLab Application ID and Secret to your Netlify site dashboard.
3. In your repository, add the following lines to your Netlify CMS `config.yml` file:

```yaml
backend:
  name: gitlab
  repo: owner-name/repo-name # Path to your GitLab repository
```

## Client-Side Implicit Grant (GitLab)

With GitLab's Implicit Grant, users can authenticate with GitLab directly from the client. To do this:

1. Follow the [GitLab docs](https://docs.gitlab.com/ee/integration/oauth_provider.html#adding-an-application-through-the-profile) to add your Netlify CMS instance as an OAuth application. For the **Redirect URI**, enter the address where you access Netlify CMS, for example, `https://www.mysite.com/admin/`. For scope, select `api`.
2. GitLab gives you an **Application ID**. Copy this ID and enter it in your Netlify CMS `config.yml` file, along with the following settings:

   ```yaml
   backend:
     name: gitlab
     repo: owner-name/repo-name # Path to your GitLab repository
     auth_type: implicit # Required for implicit grant
     app_id: your-app-id # Application ID from your GitLab settings
   ```

   You can also use Implicit Grant with a self-hosted GitLab instance. This requires adding `api_root`, `base_url`, and `auth_endpoint` fields:

   ```yaml
   backend:
     name: gitlab
     repo: owner-name/repo-name # Path to your GitLab repository
     auth_type: implicit # Required for implicit grant
     app_id: your-app-id # Application ID from your GitLab settings
     api_root: https://my-hosted-gitlab-instance.com/api/v4
     base_url: https://my-hosted-gitlab-instance.com
     auth_endpoint: oauth/authorize
   ```

**Note:** In both cases, GitLab also provides you with a client secret. You should *never* store this in your repo or reveal it in the client.