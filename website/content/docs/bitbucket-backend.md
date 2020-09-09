---
group: Accounts
weight: 20
title: Bitbucket
---
For repositories stored on Bitbucket, the `bitbucket` backend allows CMS users to log in directly with their Bitbucket account. Note that all users must have write access to your content repository for this to work.

To enable it:

1. Follow the authentication provider setup steps in the [Netlify docs](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider).
2. Add the following lines to your Netlify CMS `config.yml` file:

   ```yaml
   backend:
     name: bitbucket
     repo: owner-name/repo-name # Path to your Bitbucket repository
   ```

### Client-Side Implicit Grant (Bitbucket)

With Bitbucket's Implicit Grant, users can authenticate with Bitbucket directly from the client. To do this:

1. Follow the [Atlassian docs](https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-cloud-238027431.html) to create an OAuth consumer. Make sure you allow `Account/Read` and `Repository/Write` permissions. To use the [Editorial Workflow](https://www.netlifycms.org/docs/configuration-options/#publish-mode), allow `PullRequests/Write` permissions. For the **Callback URL**, enter the address where you access Netlify CMS, for example, `https://www.mysite.com/admin/`.
2. Bitbucket gives you a **Key**. Copy this Key and enter it in your Netlify CMS `config.yml` file, along with the following settings:

   ```yaml
   backend:
     name: bitbucket
     repo: owner-name/repo-name
     branch: default
     auth_type: implicit
     app_id: # The Key from your Bitbucket settings
   ```

**Warning:** With Bitbucket implicit grant, the authentication is valid for 1 hour only. After that, the user has to login again, **which can lead to data loss** if the expiration occurs while content is being edited.
