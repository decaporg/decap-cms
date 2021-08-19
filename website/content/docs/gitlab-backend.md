---
title: GitLab
group: Accounts
weight: 40
---
For repositories stored on GitLab, the `gitlab` backend allows CMS users to log in directly with their GitLab account. Note that all users must have push access to your content repository for this to work.

**Note:** GitLab default branch is protected by default, thus typically requires `maintainer` permissions in order for users to have push access.

The GitLab API allows for three types of OAuth2 flows:

* [Authorization Code Flow](https://docs.gitlab.com/ce/api/oauth2.html#authorization-code-flow), which works much like the GitHub OAuth flow described above.
* [Authorization Code with PKCE Flow](https://docs.gitlab.com/ce/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce), which operates *without* the need for an authentication server.
* (DEPRECATED [Implicit Grant Flow](https://docs.gitlab.com/ce/api/oauth2.html#implicit-grant-flow), which operates *without* the need for an authentication server.

## Authorization Code Flow with Netlify

When using GitLab's Authorization Code Flow for authentication, you can use Netlify to handle the server-side authentication requests.

To enable it:

1. Follow the [GitLab docs](https://docs.gitlab.com/ee/integration/oauth_provider.html#adding-an-application-through-the-profile) to add your Netlify CMS instance as an OAuth application. For the **Redirect URI**, enter `https://api.netlify.com/auth/done`, and check the box for `api` scope.
2. Follow the [Netlify docs](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider) to add your new GitLab Application ID and Secret to your Netlify site dashboard.
3. In your repository, add the following lines to your Netlify CMS `config.yml` file:

```yaml
backend:
  name: gitlab
  repo: owner-name/repo-name # Path to your GitLab repository
```


## Client-Side PKCE Authorization

With GitLab's PKCE authorization, users can authenticate with GitLab directly from the client. To do this:

1. Follow the [GitLab docs](https://docs.gitlab.com/ee/integration/oauth_provider.html#adding-an-application-through-the-profile) to add your Netlify CMS instance as an OAuth application and uncheck the **Confidential** checkbox. For the **Redirect URI**, enter the address where you access Netlify CMS, for example, `https://www.mysite.com/admin/`. For scope, select `api`.
2. GitLab gives you an **Application ID**. Copy this ID and enter it in your Netlify CMS `config.yml` file, along with the following settings:

   ```yaml
   backend:
     name: gitlab
     repo: owner-name/repo-name # Path to your GitLab repository
     auth_type: pkce # Required for pkce
     app_id: your-app-id # Application ID from your GitLab settings
   ```

   You can also use PKCE Authorization with a self-hosted GitLab instance. This requires adding `api_root`, `base_url`, and `auth_endpoint` fields:

   ```yaml
   backend:
     name: gitlab
     repo: owner-name/repo-name # Path to your GitLab repository
     auth_type: pkce # Required for pkce
     app_id: your-app-id # Application ID from your GitLab settings
     api_root: https://my-hosted-gitlab-instance.com/api/v4
     base_url: https://my-hosted-gitlab-instance.com
     auth_endpoint: oauth/authorize
   ```

## (DEPRECATED) Client-Side Implicit Grant

**Note:** This method is not recommended and will be deprecated both [by GitLab](https://gitlab.com/gitlab-org/gitlab/-/issues/288516) and [in the OAuth 2.1 specification](https://oauth.net/2.1/) in the future.

With GitLab's Implicit Grant, users can authenticate with GitLab directly from the client. To do this:

1. Follow the [GitLab docs](https://docs.gitlab.com/ee/integration/oauth_provider.html#adding-an-application-through-the-profile) to add your Netlify CMS instance as an OAuth application and uncheck the **Confidential** checkbox. For the **Redirect URI**, enter the address where you access Netlify CMS, for example, `https://www.mysite.com/admin/`. For scope, select `api`.
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

**Note:** In all cases, GitLab also provides you with a client secret. You should *never* store this in your repo or reveal it in the client.
