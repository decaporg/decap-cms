---
title: Authentication & Backends
position: 25
---

# Authentication & Backends

Netlify CMS stores content in your GitHub repository. (GitLab and Bitbucket coming soon!) In order for this to work, you need to authenticate with GitHub, and that requires a server. We have a few options for handling this.

## Git Gateway with Netlify Identity

[Git Gateway](https://github.com/netlify/git-gateway) is a Netlify open source project that allows you to add editors to your site CMS without giving them direct push access to your GitHub repository. [Netlify Identity](https://www.netlify.com/docs/identity/) service handles the authentication and provides a simple interface for user management. The Netlify CMS [featured templates](https://www.netlifycms.org/docs/start-with-a-template) are working examples of this backend.

To use it in your own project, follow these steps:

1. Head over to the [Netlify Identity docs](https://www.netlify.com/docs/identity) and follow the
   steps to get started.
2. Add the following lines to your `config.yml` file:

    ``` yaml
    backend:
      name: git-gateway
      accept_roles: #optional - accepts all users if left out
        - admin
        - editor
      
    ```

3. Optionally, you can assign roles to users in your Netlify dashboard, and then limit which
   roles can access the CMS by defining the `accept_roles` field in the `config.yml` example above.
   Otherwise `accept_roles` can be left out, and all Netlify Identity users on your site will have access.

## Git Gateway without Netlify

You can use [Git Gateway](https://github.com/netlify/git-gateway) without Netlify by setting up your own Git Gateway server and connecting it with your own instance of [GoTrue](https://www.gotrueapi.org) (the open source microservice that powers Netlify Identity), or with any other identity service that can issue JSON Web Tokens (JWT).

To configure in Netlify CMS, use the same `backend` settings in your `config.yml` file as described in Step 2 of the [Git Gateway with Netlify Identity](#git-gateway-with-netlify-identity) instructions above.

## GitHub Backend

The GitHub backend allows CMS users to log in directly with their GitHub account. Note that the
user's GitHub account must have push access to your content repository for this to work.

Because Github [requires a
server](https://github.com/netlify/netlify-cms/issues/663#issuecomment-335023723) for
authentication, Netlify facilitates basic GitHub authentication.

To enable it:

1. Follow the authentication provider setup steps in the [Netlify
   docs](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider).
2. Add the following lines to your `config.yml` file:

    ``` yaml
    backend:
      name: github
      repo: owner-name/repo-name # Path to your Github repository
    ```


### External OAuth Clients
If you would like to facilitate your own OAuth authentication rather than use Netlify's service, you
can use one of the community-maintained projects below. Feel free to [submit a pull request](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md) if you'd like to add yours!


| Author                                         | Supported Git hosts       | Languages | Link                                                                         |
|------------------------------------------------|---------------------------|-----------|------------------------------------------------------------------------------|
| [@vencax](https://github.com/vencax)           | GitHub, GitHub Enterprise | Node.js   | [Repo](https://github.com/vencax/netlify-cms-github-oauth-provider)          |
| [@igk1972](https://github.com/igk1972)         | GitHub, GitHub Enterprise | Go        | [Repo](https://github.com/igk1972/netlify-cms-oauth-provider-go)             |
| [@davidejones](https://github.com/davidejones) | GitHub, GitHub Enterprise | Python    | [Repo](https://github.com/davidejones/netlify-cms-oauth-provider-python)     |

Check each project's documentation for instructions on how to configure it.


## Bitbucket and GitLab Support

Netlify CMS is meant to be platform agnostic, so we’re always looking to expand the ecosystem and
find new ways to use it. Check out our active PRs in progress for
[Bitbucket](https://github.com/netlify/netlify-cms/pull/525) and
[Gitlab](https://github.com/netlify/netlify-cms/pull/517) backends.

Git Gateway could also be modified to support these Git hosts. If you're interested, you can file an
issue (or a pull request!) in the [git-gateway repo](https://github.com/netlify/git-gateway).

## Options

Both `git-gateway` and `github` backends allow some additional optional fields for certain use
cases. A full reference is below. Note that these are properties of the `backend` field, and should
be nested under that field.

| Field          | Default                                                           | Description                                                                                                                                          |
|----------------|-------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `repo`         | none                                                              | **Required** for `github` backend; ignored by `git-gateway`. Follows the pattern `[org-or-username]/[repo-name]`.                                    |
| `accept_roles` | none                                                              | `git-gateway` only. Limits CMS access to your defined array of user roles. Omitting this field gives access to all registered users.                 |
| `branch`       | `master`                                                          | The branch where published content is stored. All CMS commits and PRs are made to this branch.                                                       |
| `api_root`     | `https://api.github.com` (ignored for `git-gateway` backend)      | The API endpoint. Only necessary in certain cases, like with GitHub Enterprise.                                                                      |
| `site_domain`  | `location.hostname` (or `cms.netlify.com` when on `localhost`)    | Sets the `site_id` query param sent to the API endpoint. Non-Netlify auth setups will often need to set this for local development to work properly. |
| `base_url`     | `https://api.netlify.com`                                         | OAuth client URL for the `github` backend. **Required** when using an external OAuth server with the `github` backend.                               |
