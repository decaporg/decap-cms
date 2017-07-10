# Custom Authentication

Netlify CMS is meant to be platform agnostic, so we're always looking to expand the ecosystem and find new ways to use it. Below is a list of currently submitted OAuth providers - feel free to [submit a pull request](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md) if you'd like to add yours!

## External OAuth Clients:
| Author     | Supported Git hosts       | Languages | Link                                                                |
|------------|---------------------------|-----------|---------------------------------------------------------------------|
| @vencax    | GitHub, GitHub Enterprise | Node.js   | [Repo](https://github.com/vencax/netlify-cms-github-oauth-provider) |

Check each project's readme for instructions on how to configure it.

## Configuration
CMS configuration properties that affect authentication, including some optional properties that aren't mentioned elsewhere in the docs, are explained below:

```yaml
backend:

  # REQUIRED CONFIG
  name: github
  repo: user/repository

  # OPTIONAL CONFIG
  # Note: no trailing slashes on URLs
  api_root: https://github.some.domain.com/api/v3
  site_domain: static.site.url.com
  base_url: https://auth.server.url.com
```

* **name** name of the auth provider, varies by implementation. `github` when using GitHub auth, even with a third party auth client.
* **repo** repo where content is to be stored.
* **api_root (optional)** the API endpoint. Defaults to `https://api.github.com` when used with the `github` provider. Only necessary in certain cases, eg. when using with GitHub Enterprise.
* **site_domain (optional)** sets `site_id` query param sent to API endpoint, defaults to `location.hostname`, minus any port, or `cms.netlify.com` on localhost so that auth "just works" during local development. Sites with custom authentication will often need to set this for local development to work properly.
* **base_url (optional)** OAuth client URL, defaults to `https:/api.netlify.com` as a convenience. This is **required** when using an external OAuth server.
