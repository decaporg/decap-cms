# Quick Start

There are many ways to add Netlify CMS to your static site. This guide will take you through one of the quickest, which takes advantage of Netlify's hosting and authentication provider services.

## Storage and Authentication

Netlify CMS relies on the GitHub API for managing files, so you'll need to have your site stored in a GitHub repo. (If you're partial to another Git hosting service, you can file a [feature request](https://github.com/netlify/netlify-cms/issues), or [help us add it](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md).) To connect to the repo and make changes, the app needs to authenticate with the GitHub API. You can roll your own service for doing this, but we're going to use Netlify.

### Hosting with Netlify

In order to use Netlify's authentication provider service, you'll need to connect your site repo with Netlify. Netlify has published a general [Step-by-Step Guide](https://www.netlify.com/blog/2016/10/27/a-step-by-step-guide-deploying-a-static-site-or-single-page-app/) for this, along with detailed guides for many popular static site generators, including [Jekyll](https://www.netlify.com/blog/2015/10/28/a-step-by-step-guide-jekyll-3.0-on-netlify/), [Hugo](https://www.netlify.com/blog/2016/09/21/a-step-by-step-guide-victor-hugo-on-netlify/), [Hexo](https://www.netlify.com/blog/2015/10/26/a-step-by-step-guide-hexo-on-netlify/), [Middleman](https://www.netlify.com/blog/2015/10/01/a-step-by-step-guide-middleman-on-netlify/), and more.

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

These generators... | store static files in
--- | ---
Jekyll, GitBook | `/` (project root)
Hugo | `/static`
Hexo, Middleman | `/source`
Spike | `/views`

If your generator isn't listed here, you can check its documentation, or as a shortcut, look in your project for a `CSS` or `images` folder. They're usually processed as static files, so it's likely you can store your `admin` folder next to those. (When you've found the location, feel free to add it to these docs!).

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
By default, saving a post in the CMS interface will push a commit directly to the branch specified in `backend`. However, you also have the option to enable the [Editorial Workflow](editorial-workflow.md), which adds an interface for drafting, reviewing, and approving posts. To do this, simply add this line to your `config.yml`:

``` yaml
publish_mode: editorial_workflow
```

### Media and Public Folders
Netlify CMS allows users to upload images directly within the editor. For this to work, the CMS needs to know where to save them. If you already have an `images` folder in your project, you could use its path, possibly creating an `uploads` sub-folder, for example:

``` yaml
media_folder: "images/uploads" # Media files will be stored in the repo under images/uploads
```

If you're creating a new folder for uploaded media, you'll need to know where your static site generator expects static files. You can refer to the paths outlined above in [App File Structure](#app-file-structure), and put your media folder in the same location where you put the `admin` folder.

Note that the`media_folder` file path is relative to the project root, so the  example above would work for Jekyll, GitBook, or any other generator that stores static files at the project root. It would not, however, work for Hugo, Hexo, Middleman, or others that use a different path. Here's an example that could work for a Hugo site:

``` yaml
media_folder: "static/images/uploads" # Media files will be stored in the repo under static/images/uploads
public_folder: "/images/uploads" # The src attribute for uploaded media will begin with /images/uploads
```

This configuration adds a new setting, `public_folder`. While `media_folder` specifies where uploaded files will be saved in the repo, `public_folder` indicates where they can be found in the generated site. This path is used in image `src` attributes and is relative to the file where it's called. For this reason, we usually start the path at the site root, using the opening `/`.

>If `public_folder` is not set, Netlify CMS will default to the same value as `media_folder`, adding an opening `/` if one is not included.

### Collections
Collections define the structure for the different content types on your static site. Since every site is different, the `collections` settings will be very different from one site to the next. Let's say your site has a blog, with the posts stored in `_posts/blog`, and files saved in a date-title format, like `1999-12-31-lets-party.md`. Each post
begins with settings in yaml-formatted front matter, like so:

``` yaml
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

``` yaml
collections:
  - name: "blog" # Used in routes, e.g. /admin/collections/blog
    label: "Blog" # Used in the UI
    folder: "_posts/blog" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}" # Filename template i.e. YYYY-MM-DD-title.md
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
        <li><code>label</code>: Field label in the editor UI</li>
        <li><code>name</code>: Field name in the document front matter</li>
        <li><code>widget</code>: Determines UI style and value data type (details below)</li>
        <li><code>default</code> (optional): Sets a default value for the field</li>
      </ul>
    </td>
  </tr>
</table>

As described above, the `widget` property specifies a built-in or custom UI widget for a given field. The first field in the example, `layout`, uses a `hidden` widget. This widget will not show in the editor UI, but will be saved with the `default` value (assuming it's been set) in the document front matter. The rest of the widgets work as follows:

Widget | UI | Data Type
--- | --- | ---
`string` | text input | string
`datetime` | date picker widget | ISO date string
`image` | file picker widget with drag-and-drop | file path saved as string, image uploaded to media folder
`number` | text input with `+` and `-` buttons | number
`markdown` | rich text editor with raw option | markdown-formatted string



Based on this example, you can go through the post types in your site and add the appropriate settings to your `config.yml` file. Each post type should be listed as a separate node under the `collections` field.

### Filter
The entries for any collection can be filtered based on the value of a single field. The example
collection below would only show post entries with the value "en" in the language field.

``` yaml
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
## Accessing the App

With your configuration complete, it's time to try it out! Go to `yoursite.com/admin` and complete the login prompt to access the admin interface. To add users, simply add them as collaborators on the GitHub repo.

Happy posting!
