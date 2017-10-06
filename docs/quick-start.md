# Quick Start

There are many ways to add Netlify CMS to your static site. This guide will take you through one of the quickest methods, which takes advantage of Netlify's hosting and authentication provider services.

## Storage and Authentication

Netlify CMS relies on the GitHub API for managing files, so you'll need to have your site stored in a GitHub repo. (If you're partial to another Git hosting service, you can file a [feature request](https://github.com/netlify/netlify-cms/issues), or [help us add it](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md).) To connect to the repo and make changes, the app needs to authenticate with the GitHub API. You can roll your own service for doing this, but we're going to use Netlify in this example.

### Hosting with Netlify

In order to use Netlify's authentication provider service, you'll need to connect your site repo with Netlify. Netlify has published a general [Step-by-Step Guide](https://www.netlify.com/blog/2016/10/27/a-step-by-step-guide-deploying-a-static-site-or-single-page-app/) for this, along with detailed guides for many popular static site generators, including [Jekyll](https://www.netlify.com/blog/2015/10/28/a-step-by-step-guide-jekyll-3.0-on-netlify/), [Hugo](https://www.netlify.com/blog/2016/09/21/a-step-by-step-guide-victor-hugo-on-netlify/), [Hexo](https://www.netlify.com/blog/2015/10/26/a-step-by-step-guide-hexo-on-netlify/), [Middleman](https://www.netlify.com/blog/2015/10/01/a-step-by-step-guide-middleman-on-netlify/), [Gatsby](https://www.netlify.com/blog/2016/02/24/a-step-by-step-guide-gatsby-on-netlify/) and more.

### Authenticating with GitHub

In order to connect Netlify CMS with your GitHub repo, you'll first need to register it as an authorized application with your GitHub account:

 1. Go to your account **Settings** page on GitHub, and click **Oauth Applications** under **Developer Settings** (or use [this shortcut](https://github.com/settings/developers)).
 2. Click **Register a new application**.
 3. For the **Authorization callback URL**, enter `https://api.netlify.com/auth/done`. The other fields can contain anything you want.

![GitHub Oauth Application setup example](/img/github-oauth.png?raw=true)

When you complete the registration, you'll be given a **Client ID** and a **Client Secret** for the app. You'll need to add these to your Netlify project:

 1. Go to your [**Netlify dashboard**](https://app.netlify.com/) and click on your project.
 2. Click the **Access** tab.
 3. Under **Authentication Providers**, click **Install Provider**.
 4. Select GitHub and enter the **Client ID** and **Client Secret**, then save.

## App File Structure
All Netlify CMS files are contained in a static `admin` folder, stored at the root of the generated site. Where you store this in the source files depends on your static site generator. Here's the the static file location for a few of the most popular static site generators:

These generators ... | store static files in
--- | ---
Jekyll, GitBook | `/` (project root)
Hugo, Gatsby* | `/static`
Hexo, Middleman | `/source`
Spike | `/views`

Notes:
- Gatsby treats the `static` folder more strictly when you are using `gatsby develop` and will not render the admin page if you go to `/admin` like the other generators. Instead, you must go to `/admin/index.html`. When you actually build the site with `gatsby build`, it should resolve correctly.

If your generator isn't listed here, you can check its documentation, or as a shortcut, look in your project for a `CSS` or `images` folder. They're usually processed as static files, so it's likely you can store your `admin` folder next to those. (When you've found the location, feel free to add it to these docs by [filing a pull request](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md)!).

Inside the `admin` folder, you'll create two files:

```
admin
 ├ index.html
 └ config.yml
```

The first file, `admin/index.html`, is the entry point for the Netlify CMS admin interface. This means that users can navigate to `yoursite.com/admin` to access it. On the code side, it's a basic HTML starter page that loads the necessary CSS and JavaScript files. In this example, we pull those files from a public CDN:

``` html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>

  <link rel="stylesheet" href="https://unpkg.com/netlify-cms@~0.4/dist/cms.css" />

</head>
<body>
  <script src="https://unpkg.com/netlify-cms@~0.4/dist/cms.js"></script>
</body>
</html>
```

The second file, `admin/config.yml`, is the heart of your Netlify CMS installation, and a bit more complex. The next section covers the details.

## Configuration
Configuration will be different for every site, so we'll break it down into parts.  All code snippets in this section will be added to your `admin/config.yml` file.

### Backend
Because we're using GitHub and Netlify for our hosting and authentication, backend configuration is fairly strightforward. You can start your `config.yml` file with these lines:

``` yaml
backend:
  name: github
  repo: owner-name/repo-name # Path to your Github repository
  branch: master # Branch to update
```

This names GitHub as the authentication provider, points to the repo location on github.com, and declares the branch where you want to merge changes. If you leave out the `branch` declaration, it will default to `master`.

### Editorial Workflow
By default, saving a post in the CMS interface will push a commit directly to the branch specified in `backend`. However, you also have the option to enable the [Editorial Workflow](editorial-workflow.md), which adds an interface for drafting, reviewing, and approving posts. To do this, simply add the following line to your `config.yml`:

``` yaml
publish_mode: editorial_workflow
```

### Media and Public Folders
Netlify CMS allows users to upload images directly within the editor. For this to work, the CMS needs to know where to save them. If you already have an `images` folder in your project, you could use its path, possibly creating an `uploads` sub-folder, for example:

``` yaml
media_folder: "images/uploads" # Media files will be stored in the repo under images/uploads
```

If you're creating a new folder for uploaded media, you'll need to know where your static site generator expects static files. You can refer to the paths outlined above in [App File Structure](#app-file-structure), and put your media folder in the same location where you put the `admin` folder.

Note that the`media_folder` file path is relative to the project root, so the  example above would work for Jekyll, GitBook or any other generator that stores static files at the project root. It would not, however, work for Hugo, Hexo, Middleman or others that use a different path. Here's an example that could work for a Hugo site:

``` yaml
media_folder: "static/images/uploads" # Media files will be stored in the repo under static/images/uploads
public_folder: "/images/uploads" # The src attribute for uploaded media will begin with /images/uploads
```

This configuration adds a new setting, `public_folder`. While `media_folder` specifies where uploaded files will be saved in the repo, `public_folder` indicates where they can be found in the generated site. This path is used in image `src` attributes and is relative to the file where it's called. For this reason, we usually start the path at the site root, using the opening `/`.

>If `public_folder` is not set, Netlify CMS will default to the same value as `media_folder`, adding an opening `/` if one is not included.

### Collections
Collections define the structure for the different content types on your static site. They will be the main part of your config, and are explained in detail on the [Collections](collections.md) page.

## Accessing the App

With your configuration complete, it's time to try it out! Go to `yoursite.com/admin` and complete the login prompt to access the admin interface. To add users, simply add them as collaborators on the GitHub repo.

Happy posting!
