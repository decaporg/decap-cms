# Authentication & Backends

Committing content changes to your project repo requires authentication with the GitHub API. This is a server-side process, and Netlify CMS offers a few different options to handle this.

## Git Gateway with Netlify Identity

You can check out this authentication method by using the deploy button in the [Test Drive](/test-drive/). It allows you to invite and manage CMS users from the site dashboard on Netlify, giving them permission to use the CMS without requiring commit access to the repo or even a GitHub account at all. All commits are run through a personal access token with limited access rights. (It also lets you to make cool zero-config templates like that one in the Test Drive.)

To use it in your own project, add the following lines to your `config.yml` file:

``` yaml
backend:
  name: git-gateway
  accept_roles: admin, editor #optional - accepts all user roles if left out
```

*Find [More Config Options](#more-config-options) for this backend at the end of this doc.*

Then, you can go to the Netlify dashboard to set up [Identity](https://www.netlify.com/docs/identity/) and enable their managed version of [Git Gateway](https://www.netlify.com/docs/git-gateway/). You'll also need to add a login form to your site, or use the [Netlify Identity widget](https://github.com/netlify/netlify-identity-widget).

For the optional `accepts_roles` field above, you name your own roles when [managing users](https://www.netlify.com/docs/identity/#managing-existing-users) in Netlify Identity. If a user role matches an accepted role, the user will be granted access to the CMS on login.

### Git Gateway without Netlify

The instructions above leverage Netlify services, but [Git Gateway](https://github.com/netlify/git-gateway) is open source, so you can roll your own Git Gateway server, and connect to it with your own instance of [GoTrue](https://www.gotrueapi.org) (the open source microservice that powers Netlify Identity), or with any other identity service that can issue JSON Web Tokens (JWT).


## GitHub Backend

If all of your content editors already have commit access to your project repo, you may prefer to authenticate directly with GitHub. With this backend, any GitHub user with commit access to your repo will be able to log in to Netlify CMS.

To enable it, add the following lines to your `config.yml` file:

``` yaml
backend:
  name: github
  repo: owner-name/repo-name # Path to your Github repository
```

*Find [More Config Options](#more-config-options) for this backend at the end of this doc.*

Though GitHub handles the access control in this setup, their OAuth flow [still requires a server](https://github.com/netlify/netlify-cms/issues/663#issuecomment-335023723). Netlify provides an [easy setup for this](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider), or you can use another service.

Below is a list of community-submitted OAuth providers—feel free to [submit a pull request](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md) if you'd like to add yours!

## External OAuth Clients:
| Author     | Supported Git hosts       | Languages | Link                                                                |
|------------|---------------------------|-----------|---------------------------------------------------------------------|
| @vencax    | GitHub, GitHub Enterprise | Node.js   | [Repo](https://github.com/vencax/netlify-cms-github-oauth-provider) |

Check each project's README for instructions on how to configure it.


## Bitbucket and GitLab Support

Netlify CMS is meant to be platform agnostic, so we’re always looking to expand the ecosystem and find new ways to use it. Check out our active PRs in progress for [`bitbucket`](https://github.com/netlify/netlify-cms/pull/525) and [`gitlab`](https://github.com/netlify/netlify-cms/pull/517) backends.

Git Gateway could also be modified to support these Git hosts. If you're interested, you can file an issue (or a pull request!) in the [git-gateway repo](https://github.com/netlify/git-gateway).

## More Config Options

Both `git-gateway` and `github` backends allow some additional optional fields for certain use cases. You would add these options indented once under the `backend` field, on the same level as the `name` field.

### Sample Syntax

```
  branch: production
  api_root: https://github.some.domain.com/api/v3
  site_domain: static.site.url.com
  base_url: https://auth.server.url.com
```

### Descriptions

* `branch`: Defaults to `master`. All commits in the simple workflow commit to this branch. All pull requests created in the [editorial workflow](/docs/editorial-workflow) compare and merge to this branch.
* `api_root`: The API endpoint. `git-gateway` ignores this setting; `github` defaults to `https://api.github.com`. Only necessary in certain cases, like when using the `github` backend with GitHub Enterprise.
* `site_domain`: Sets the `site_id` query param sent to the API endpoint. Defaults to `location.hostname`, minus any port, or `cms.netlify.com` when on localhost so that authentication "just works" during local development. Sites with non-Netlify authentication will often need to set this for local development to work properly.
* `base_url`: OAuth client URL for the `github` backend. Defaults to `https://api.netlify.com` as a convenience. This is **required** when using an external OAuth server with the `github` backend.