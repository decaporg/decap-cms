---
title: Add to Your Site
weight: 20
menu:
  docs:
    parent: start
---

# Add Netlify CMS to Your Site

Netlify CMS is adaptable to a wide variety of projects. The only inflexible requirement is that your site content must be written in markdown, JSON, YAML, or TOML files, stored in a repo on [GitHub](https://github.com/) or [GitLab](https://about.gitlab.com/). You can also create your own custom backend, or if you're interested in Bitbucket support, that's [coming soon](https://github.com/netlify/netlify-cms/pull/525).

This tutorial will guide you through the steps for adding Netlify CMS to a site that's built with a common [static site generator](https://www.staticgen.com/), like Jekyll, Hugo, Hexo, or Gatsby. Alternatively, you can [start from a template](https://www.netlifycms.org/docs/start-with-a-template) or dive right into to [configuration options](https://www.netlifycms.org/docs/configuration-options).

## App File Structure

All Netlify CMS files are contained in a static `admin` folder, stored at the root of your published site. Where you store this folder in the source files depends on your static site generator. Here's the static file location for a few of the most popular static site generators:

| These generators ... | store static files in |
| -------------------- | --------------------- |
| Jekyll, GitBook      | `/` (project root)    |
| Hugo, Gatsby, Nuxt   | `/static`             |
| Hexo, Middleman      | `/source`             |
| Spike                | `/views`              |
| Wyam                 | `/input`              |

If your generator isn't listed here, you can check its documentation, or as a shortcut, look in your project for a `css` or `images` folder. The contents of folders like that are usually processed as static files, so it's likely you can store your `admin` folder next to those. (When you've found the location, feel free to add it to these docs by [filing a pull request](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md)!)

Inside the `admin` folder, you'll create two files:

```x
admin
 ├ index.html
 └ config.yml
```

The first file, `admin/index.html`, is the entry point for the Netlify CMS admin interface. This means that users can navigate to `yoursite.com/admin/` to access it. On the code side, it's a basic HTML starter page that loads the necessary CSS and JavaScript files. In this example, we pull those files from a public CDN:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>

  <!-- Include the styles for the Netlify CMS UI, after your own styles -->
  <link rel="stylesheet" href="https://unpkg.com/netlify-cms@^1.0.0/dist/cms.css" />

</head>
<body>
  <!-- Include the script that builds the page and powers Netlify CMS -->
  <script src="https://unpkg.com/netlify-cms@^1.0.0/dist/cms.js"></script>
</body>
</html>
```

The second file, `admin/config.yml`, is the heart of your Netlify CMS installation, and a bit more complex. The [Configuration](#configuration) section covers the details.

### Installing with npm

You can also use Netlify CMS as an npm module. Wherever you import Netlify CMS, it will automatically run, taking over the current page. Make sure the script that imports it is only run on your CMS page. First install the package and save it to your project:

```bash
npm install netlify-cms --save
```

Then import it (assuming your project has tooling for imports):

```js
import CMS from 'netlify-cms'

// Now the registry is available via the CMS object.
CMS.registerPreviewTemplate('my-template', MyTemplate)
```

## Configuration

Configuration will be different for every site, so we'll break it down into parts.  All code snippets in this section will be added to your `admin/config.yml` file.

### Backend

We're using [Netlify](https://www.netlify.com) for our hosting and authentication in this tutorial, so backend configuration is fairly straightforward. You can start your Netlify CMS `config.yml` file with these lines:

```yaml
backend:
  name: git-gateway
  branch: master # Branch to update (optional; defaults to master)
```

These lines specify your backend protocol and your publication branch. Git Gateway is an open source API that acts as a proxy between authenticated users of your site and your site repo. (We'll get to the details of that in the [Authentication section](#authentication) below.) If you leave out the `branch` declaration, it will default to `master`.

### Editorial Workflow

**Note:** Editorial workflow works with GitHub repositories only. Support for other Git hosts is [coming soon](https://github.com/netlify/netlify-cms/issues/568).

By default, saving a post in the CMS interface will push a commit directly to the publication branch specified in `backend`. However, you also have the option to enable the [Editorial Workflow](https://www.netlifycms.org/docs/configuration-options/#publish-mode), which adds an interface for drafting, reviewing, and approving posts. To do this, add the following line to your Netlify CMS `config.yml`:

```yaml
# This line should *not* be indented
publish_mode: editorial_workflow
```

### Media and Public Folders

Netlify CMS allows users to upload images directly within the editor. For this to work, the CMS needs to know where to save them. If you already have an `images` folder in your project, you could use its path, possibly creating an `uploads` sub-folder, for example:

```yaml
# This line should *not* be indented
media_folder: "images/uploads" # Media files will be stored in the repo under images/uploads
```

If you're creating a new folder for uploaded media, you'll need to know where your static site generator expects static files. You can refer to the paths outlined above in [App File Structure](#app-file-structure), and put your media folder in the same location where you put the `admin` folder.

Note that the`media_folder` file path is relative to the project root, so the example above would work for Jekyll, GitBook, or any other generator that stores static files at the project root. However, it would not work for Hugo, Hexo, Middleman or others that store static files in a subfolder. Here's an example that could work for a Hugo site:

```yaml
# These lines should *not* be indented
media_folder: "static/images/uploads" # Media files will be stored in the repo under static/images/uploads
public_folder: "/images/uploads" # The src attribute for uploaded media will begin with /images/uploads
```

The configuration above adds a new setting, `public_folder`. While `media_folder` specifies where uploaded files will be saved in the repo, `public_folder` indicates where they can be found in the published site. This path is used in image `src` attributes and is relative to the file where it's called. For this reason, we usually start the path at the site root, using the opening `/`.

_If `public_folder` is not set, Netlify CMS will default to the same value as `media_folder`, adding an opening `/` if one is not included._

### Collections

Collections define the structure for the different content types on your static site. Since every site is different, the `collections` settings will be very different from one site to the next.

Let's say your site has a blog, with the posts stored in `_posts/blog`, and files saved in a date-title format, like `1999-12-31-lets-party.md`. Each post begins with settings in yaml-formatted front matter, like so:

```yaml
---
layout: blog
title: "Let's Party"
date: 1999-12-31 11:59:59 -0800
thumbnail: "/images/prince.jpg"
rating: 5
---

This is the post body, where I write about our last chance to party before the Y2K bug destroys us all.
```

Given this example, our `collections` settings would look like this:

```yaml
collections:
  - name: "blog" # Used in routes, e.g., /admin/collections/blog
    label: "Blog" # Used in the UI
    folder: "_posts/blog" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}" # Filename template, e.g., YYYY-MM-DD-title.md
    fields: # The fields for each document, usually in front matter
      - {label: "Layout", name: "layout", widget: "hidden", default: "blog"}
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Featured Image", name: "thumbnail", widget: "image"}
      - {label: "Rating (scale of 1-5)", name: "rating", widget: "number"}
      - {label: "Body", name: "body", widget: "markdown"}
```

Let's break that down:

<table>
  <tr>
    <td><code>name</code></td>
    <td>Post type identifier, used in routes. Must be unique.</td>
  </tr>
  <tr>
    <td><code>label</code></td>
    <td>What the post type will be called in the admin UI.</td>
  </tr>
  <tr>
    <td><code>folder</code></td>
    <td>Where files of this type are stored, relative to the repo root.</td>
  </tr>
  <tr>
    <td><code>create</code></td>
    <td>Set to <code>true</code> to allow users to create new files in this collection.
</td>
  </tr>
  <tr>
    <td><code>slug</code></td>
    <td>Template for filenames. <code>{{year}}</code>, <code>{{month}}</code>, and <code>{{day}}</code> will pull from the post's <code>date</code> field or save date. <code>{{slug}}</code> is a url-safe version of the post's <code>title</code>. Default is simply <code>{{slug}}</code>.
</td>
  </tr>
  <tr>
    <td><code>fields</code></td>
    <td>Fields listed here are shown as fields in the content editor, then saved as front matter at the beginning of the document (except for <code>body</code>, which follows the front matter). Each field contains the following properties:
      <ul>
        <li><code>label</code>: Field label in the editor UI.</li>
        <li><code>name</code>: Field name in the document front matter.</li>
        <li><code>widget</code>: Determines UI style and value data type (details below).</li>
        <li><code>default</code> (optional): Sets a default value for the field.</li>
      </ul>
    </td>
  </tr>
</table>

As described above, the `widget` property specifies a built-in or custom UI widget for a given field. When a content editor enters a value into a widget, that value will be saved in the document front matter as the value for the `name` specified for that field. A full listing of available widgets can be found in the [Widgets doc](https://www.netlifycms.org/docs/widgets).

Based on this example, you can go through the post types in your site and add the appropriate settings to your Netlify CMS `config.yml` file. Each post type should be listed as a separate node under the `collections` field.

### Filter

The entries for any collection can be filtered based on the value of a single field. The example collection below would only show post entries with the value "en" in the language field.

```yaml
collections:
  - name: "posts"
    label: "Post"
    folder: "_posts"
    filter:
      field: language
      value: en
    fields:
      - {label: "Language", name: "language"}
```

## Authentication

Now that you have your Netlify CMS files in place and configured, all that's left is to enable authentication. There are [many ways to do this](https://www.netlifycms.org/docs/authentication-backends) (with or without deploying to Netlify), but this example uses Netlify because it's one of the quickest ways to get started.

### Setup on Netlify

Netlify offers a built-in authentication service called Identity. In order to use it, you'll need to connect your site repo with Netlify. Netlify has published a general [Step-by-Step Guide](https://www.netlify.com/blog/2016/10/27/a-step-by-step-guide-deploying-a-static-site-or-single-page-app/) for this, along with detailed guides for many popular static site generators, including [Jekyll](https://www.netlify.com/blog/2015/10/28/a-step-by-step-guide-jekyll-3.0-on-netlify/), [Hugo](https://www.netlify.com/blog/2016/09/21/a-step-by-step-guide-victor-hugo-on-netlify/), [Hexo](https://www.netlify.com/blog/2015/10/26/a-step-by-step-guide-hexo-on-netlify/), [Middleman](https://www.netlify.com/blog/2015/10/01/a-step-by-step-guide-middleman-on-netlify/), [Gatsby](https://www.netlify.com/blog/2016/02/24/a-step-by-step-guide-gatsby-on-netlify/) and more.

### Enable Identity and Git Gateway

Netlify's Identity and Git Gateway services allow you to manage CMS admin users for your site without requiring them to have an account with your Git host or commit access on your repo. From your site dashboard on Netlify:

1. Go to **Settings > Identity**, and select **Enable Identity service**.
2. Under **Registration preferences**, select **Open** or **Invite only**. In most cases, you'll want only invited users to access your CMS, but if you're just experimenting, you can leave it open for convenience.
3. If you'd like to allow one-click login with services like Google and GitHub, check the boxes next to the services you'd like to use, under **External providers**.
4. Scroll down to **Services > Git Gateway**, and click **Enable Git Gateway**. This will authenticate with your Git host and generate an API access token. In this case, we're leaving the **Roles** field blank, which means any logged in user may access the CMS. For information on changing this, check the [Netlify Identity documentation](https://www.netlify.com/docs/identity/).

### Add the Netlify Identity Widget

With the backend set to handle authentication, now you need a frontend interface to connect to it. The open source Netlify Identity Widget is a drop-in widget made for just this purpose. To include the widget in your site, you'll need to add the following script tag in two places:

```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

You'll need to add this to the `<head>` of your CMS index page at `/admin/index.html`, as well as the `<head>` of your site's main index page. Depending on how your site generator is set up, this may mean you need to add it to the default template, or to a "partial" or "include" template. If you can find where the site stylesheet is linked, that's probably the right place. Alternatively, you can include the script in your site using Netlify's [Script Injection](https://www.netlify.com/docs/inject-analytics-snippets/) feature.

When a user logs in with the Netlify Identity widget, they will be directed to the site homepage with an access token. In order to complete the login and get back to the CMS, we'll need to redirect the user back to the `/admin/` path. To do this, add the following script before the closing `body` tag of your site's main index page:

```html
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/";
        });
      }
    });
  }
</script>
```

Note: This example script requires modern JavaScript and will not work on IE11. For legacy browser support, use function expressions (`function () {}`) in place of the arrow functions (`() => {}`), or use a transpiler like [Babel](https://babeljs.io/).

## Accessing the CMS

Your site CMS is now fully configured and ready for login!

If you set your registration preference to "Invite only," you'll need to invite yourself (and anyone else you choose) as a site user. To do this, select the **Identity** tab from your site dashboard, and then select the **Invite users** button. Invited users will receive an email invitation with a confirmation link. Clicking the link will take you to your site with a login prompt.

If you left your site registration open, or for return visits after comfirming an email invitation, you can access your site's CMS at `yoursite.com/admin/`.

Happy posting!
