# Authentication & Backends

Netlify CMS stores content in your GitHub repository (GitLab and Bitbucket coming soon!). You'll
need to sign in to your GitHub account through the CMS for this to work, and it requires a server.
We have a few options for handling this.

## Git Gateway with Netlify Identity

[Git Gateway](https://github.com/netlify/git-gateway) another Netlify open source project, together
with the [Netlify Identity](https://www.netlify.com/docs/identity/) service, provides a way for CMS
users to sign in with email and password, and doesn't require them to have a GitHub account. This is
a great option for non-technical editors, or if you don't want CMS users to
have direct access to your GitHub repo. You can try Git Gateway with Netlify Identity any time via
the [Test Drive](/test-drive/).

Using it in your own project is simple:

1. Head over to the [Netlify Identity docs](https://www.netlify.com/docs/identity) and follow the
   steps to get started.
2. Add the following lines to your `config.yml` file:

   ``` yaml
   backend:
     name: git-gateway
     accept_roles: "admin, editor" #optional - accepts all user roles if left out
   ```
3. Optionally, you can assign roles to users in your Netlify dashboard, and then only allow certain
   roles to access the CMS by defining the `accept_roles` field in the `config.yml` example above.
   Otherwise it can be left out.

## Git Gateway without Netlify

[Git Gateway](https://github.com/netlify/git-gateway) can be used without Netlify by setting up your
own Git Gateway server and connecting it with your own instance of
[GoTrue](https://www.gotrueapi.org) (the open source microservice that powers Netlify Identity), or
with any other identity service that can issue JSON Web Tokens (JWT).

## GitHub Backend

The GitHub backend allows CMS users to log in directly with their GitHub account. Note that the
user's GitHub account must have push access to your content repo for this to work.

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

If you would like to facilitate your own OAuth authentication rather than use Netlify's service, you
can use one of the community maintained providers below, and feel free to [submit a pull
request](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md) if you'd like to add
yours!

## External OAuth Clients:
| Author     | Supported Git hosts       | Languages | Link                                                                |
|------------|---------------------------|-----------|---------------------------------------------------------------------|
| @vencax    | GitHub, GitHub Enterprise | Node.js   | [Repo](https://github.com/vencax/netlify-cms-github-oauth-provider) |

Check each project's README for instructions on how to configure it.


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

| Field         | Required | Default                                                           | Description                                                                                                                                          |
|---------------|----------|-------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `repo`        | Yes      | n/a                                                               | The username of the repo owner, and the repo name, separated by a slash.                                                                             |
| `branch`      | No       | `master`                                                          | The branch to store published content on.                                                                                                            |
| `api_root`    | No       | `https://api.github.com` (ignored for `git-gateway` backend)      | The API endpoint. Only necessary in certain cases, e.g. for GitHub Enterprise users on the `github` backend.                                         |
| `site_domain` | No       | `[location].[hostname]` or `cms.netlify.com` when on `localhost`  | Sets the `site_id` query param sent to the API endpoint. Non-Netlify auth setups will often need to set this for local development to work properly. |
| `base_url`    | No       | `https://api.netlify.com`                                         | OAuth client URL for the `github` backend. Required when using an external OAuth server with the `github` backend.                                   |