#Advanced Configuration

There are many ways to add Netlify CMS to your static site. This is by no means a comprehensive guide, but some of the more popular use-cases will be covered, including:

* Configuration for a self-hosted Netlify CMS.
* Configuring a third-party Github Oauth server.
* Using Github Enterprise repositories.

If there's any other use-cases you're interested in or information you think is missing, you can file a [feature request](https://github.com/netlify/netlify-cms/issues), or [help us add it](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md). Let's get started!

## Register a Github Oauth App
Information is available on the [Github Developer Documentation](https://developer.github.com/apps/building-integrations/setting-up-and-registering-oauth-apps/registering-oauth-apps/). Fill out the fields however you like, however **it is critical that your _authorization callback URL_ is correct**. This tells Github where to send a user after they've authenticated, and should match the callback URL of your Oauth server. A good bet is `https://your-auth-server.com/callback`, but check what URL your server is listening for in the sourcecode.

After clicking "Register Application", you'll be provided with a `client_id` and `client_secret` on the next page that you'll use when configuring your Oauth Server

## Configure an External Oauth Server
Netlify CMS is meant to be an open platform, so we're always looking to expand the ecosystem and find new ways to use it. Below is a list of currently submitted Oauth providers, but again feel free to [submit a pull request](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md) if you think this list is missing anything.

### External Oauth Servers:
| Author     | Supported Git hosts | Language | Link |
|------------|---------------------|----------|------|
| Vencax     | Github & GH Enterprise | Node.js  | [Repo](https://github.com/vencax/netlify-cms-github-oauth-provider) |

Check an Oauth server's readme for instructions on how to configure it. Let us know if you find a readme lacking though.

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
* **base_url (optional)** tells the CMS where the Oauth server is. This is _required_ when using an external Oauth server.

### Continuous Delivery
At this point Github, your Oauth server, and your CMS should be communicating with each other, and Netlify CMS will be able to commit posts to Github. The last remaining service to setup is continuous delivery. A couple free options are Travis-ci (for public repos), and IBM's [Bluemix](https://www.ibm.com/cloud-computing/bluemix/) platform (The free tier includes hosting, docker containers, continuous delivery, and much more).
