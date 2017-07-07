#Advanced Configuration

There are many ways to add Netlify CMS to your static site. This is by no means a comprehensive guide, but some of the more popular use-cases will be covered, including:

* Configuration for a self-hosted Netlify CMS.
* Configuring a third-party Github Oauth provider.
* Using Github Enterprise repositories.

If there's any other use-cases you're interested in or information you think is missing, you can file a [feature request](https://github.com/netlify/netlify-cms/issues), or [help us add it](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md). Let's get started!

## Register a Github Oauth App
Information is available on the [Github Developer Documentation](https://developer.github.com/apps/building-integrations/setting-up-and-registering-oauth-apps/registering-oauth-apps/). Fill out the fields however you like, however **it is critical that your _authorization callback URL_ is correct**. This tells Github where to send a user after they've authenticated, and should match the URL of your Oauth provider. Use `https://your.app.com/callback` with Vencax's Oauth provider explained below.

After clicking "Register Application", you'll be provided with a `client_id` and `client_secret` on the next page that you'll use when configuring your Oauth provider

## Configure an External Oauth Provider

We'll be using Vencax's [Netlify CMS Github Oauth Provider](https://github.com/vencax/netlify-cms-github-oauth-provider) in this example. This repository is convenient because it mirrors Netlify's own Github Oauth implementation, and can support repositories from Github.com or Enterprise accounts.

Configuration is accomplished with environment variables, and is probably easiest with a `.env` file. An example would be:

```
NODE_ENV=production
OAUTH_CLIENT_ID=f432a9casdff1e4b79c57
OAUTH_CLIENT_SECRET=pampadympapampadympapampadympa
GIT_HOSTNAME=https://github.some.domain.com
```
`GIT_HOSTNAME` is only necessary if you're using Github Enterprise. Additional config and install information for Vencax's Oauth provider is available in [its repository](https://github.com/vencax/netlify-cms-github-oauth-provider).

## Configure Netlify CMS
Two files are required to add Netlify CMS to a static site, `admin/index.html` and `admin/config.yml`. Look at the [quick-start](https://www.netlifycms.org/docs/quick-start/) section for more info on where these go.

```
admin
 ├ index.html
 └ config.yml
```

### Index.html
The index file can be rather simple, but if you're planning on using your own Oauth server, ensure you're getting at least v0.4.3 of cms.js by using unpkg.com. Non-Netlify Oauth servers will not work with prior versions.
``` html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>

  <link rel="stylesheet" href="https://unpkg.com/netlify-cms@~0.4.3/dist/cms.css" />

</head>
<body>
  <script src="https://unpkg.com/netlify-cms@~0.4.3/dist/cms.js"></script>
</body>
</html>
```

### Config.yml

The `config.yml` file will vary wildly from site to site, so we'll go section by section.

#### Backend
Here is a more complex backend configuration example. Each item will be explained below:
```yaml
backend:
  # REQUIRED CONFIG
  name: github
  repo: user/repository
  branch: master
  # OPTIONAL CONFIG. No trailing slashes on URLs
  api_root: https://github.some.domain.com/api/v3
  site_id: static.site.url.com
  base_url: https://auth.server.url.com
```

* **name** is almost always `github` unless you're using `netlify-auth` or `test-repo`, which won't be covered here. It determines which type of api you're using.
* **repo** tells the CMS what repo to push to.
* **branch** tells the CMS which branch to push to.
* **api_root (optional)** is only necessary if you're hosting your repo on a Github Enterprise account. It's the api endpoint.
* **site_id (optional)** is necessary if you want to test on your local machine, and allows CORS between the api and the CMS.
* **base_url (optional)** tells the CMS where the Oauth server is. This is _required_ when using Vencax's Oauth provider.

Another convenient feature is the ability to have a different backend configuration depending on if you're running a development or production environment. This can be done like so:

```yaml
backend:
  name: netlify-auth
  repo: user/repository
  branch: dev

production:
  name: github
  repo: user/repository
  branch: master
  api_root: https://github.some.domain.com/api/v3
  site_id: static.site.url.com
  base_url: https://auth.server.url.com
```

#### Collections
You can find info on collections and translating your static site yaml front-matter to cms fields in the [quick-start](https://www.netlifycms.org/docs/quick-start/) section.

### Continuous Delivery
At this point Github, your Oauth server, and your CMS should be communicating with each other, and Netlify CMS will be able to commit posts to Github. The last remaining service to setup is continuous delivery. A couple free options are Travis.ci (for public repos), and IBM's [Bluemix](https://www.ibm.com/cloud-computing/bluemix/) platform (The free tier includes hosting, docker containers, continuous delivery, and much more).
