*(work in progress)*
# Quick Start

Netlify CMS will work with any static site generator, and can be added to any site stored on GitHub.

## Hosting with Netlify
...Notes about how you don't have to host with Netlify, but it simplifies the process, so that's what we'll use in this guide.

## Setting the File Structure
All Netlify CMS files are contained in a static `admin` folder, stored at the root of the generated site. Where you store this in the source files depends on your static site generator, since they vary in where they expect you to store "static" files (files passed to the generated site without processing). Here's the the static file location for a few of the most popular static site generators:

These generators... | store static files in
--- | ---
Jekyll, GitBook | `/` (project root)
Hugo | `/static`
Hexo, Middleman | `/source`

If your generator isn't listed here, you can check its documentation, or as a shortcut, look in your project for a `CSS` or `images` folder. They're usually processed as static files, so it's likely you can store your `admin` folder next to those. (When you've found the location, feel free to add it to these docs!).

Inside the `admin` folder, you'll create two files:

```
admin
 ├ index.html
 └ config.yml
```

## Building `index.html`
This file requires little to no configuration. You can copy the following code directly from this simple template that loads the necessary CSS and JS files from a CDN:
``` html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
  
  <!-- Include the stylesheets from your site here -->
  <link rel="stylesheet" href="https://unpkg.com/netlify-cms@^0.3/dist/cms.css" />
  <!-- Include a CMS specific stylesheet here -->

</head>
<body>
  <script src="https://unpkg.com/netlify-cms@^0.3/dist/cms.js"></script>
</body>
</html>
```
>Note: Unpkg is a CDN for javascript modules that lets you point to semantic versions of files using prefix characters (so backwards-compatible bug fixes will load as soon as they're available).

## Building `config.yml`
The `admin/config.yml` file is the heart of your Netlify CMS installation. Configuration will be different for every blog, but we'll break down each part with a basic example.  All code snippets in this section will be added to your `config.yml`.

### Backend
The beginning of your `config.yml` should include these lines:

``` yaml
backend:
  name: github
  repo: owner-name/repo-name # Path to your Github repository
  branch: master # Branch to update (master by default)
```
... talk about Github as a backend

### Authentication
... Netlify/GitHub auth procedure

### Media and Public Folders
...info about these here

``` yaml
media_folder: "source/uploads" # Media files will be stored in the repo under source/uploads
public_folder: "source" # CMS now knows 'source' is the public folder and will strip this from the path
```

## Collections
...Notes about how collections represent the fields from a file's front matter, plus the body (where applicable), with sample folder collection:
  
``` yaml
collections: # A list of collections the CMS should be able to edit
  - name: "post" # Used in routes, ie.: /admin/collections/:slug/edit
    label: "Post" # Used in the UI, ie.: "New Post"
    folder: "_posts" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    fields: # The fields each document in this collection have
      - {label: "Title", name: "title", widget: "string", tagname: "h1"}
      - {label: "Body", name: "body", widget: "markdown"}
      - {label: "Foo", name: "foo", widget: "foo"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
```
...Explain what happens with each property, and how this would map to the reader's site.

### Widgets
...Explain the use of widgets in the examples above, and how they're used.  
  
  
