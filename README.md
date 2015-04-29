# Netlify CMS

A CMS for static site generators. Give non-technical users a simple way to edit
and add content to any site built with a static site generator.

## How it works

Netlify CMS is a single page app that you pull into the `/admin` part of your site.

It presents a clean UI for editing content stored in a Git repository.

You setup a YAML config to describe the content model of your site, and typically
tweak the main layout of the CMS a bit to fit your own site.

When a user navigates to `/admin` she'll be prompted to login, and once authenticated
she'll be able to create new content or edit existing content.

## Installing

Netlify CMS is an Ember app. To install it in your site, add an /admin folder in
your source directory and use this `index.html` as a template:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Content Manager</title>
  <!-- Include the stylesheets from your site here -->
  <link rel="stylesheet" href="//ember-cms.netlify.com/assets/cms.css" />
  <!-- Include a CMS specific stylesheet here -->

  <base href="/admin/">
</head>
<body>

  <script type="text/x-handlebars" data-template-name='cms/application'>
    <header>
      {{cms-breadcrumbs}}
      <a href="#" class="logout-button" {{action 'logout'}}>Log out</a>
    </header>
    <section>{{outlet}}</section>
  </script>

  <script src="//ember-cms.netlify.com/assets/vendor.js"></script>
  <script src="//ember-cms.netlify.com/assets/cms.js"></script>
</body>
</html>
```

Add a `config.yml` file to the `/admin` folder and configure your content model:

```yaml
repo: owner/repo # Path to your Github repository
branch: master # Branch to update (master by default)
media_folder: "img/uploads" # Folder where user uploaded files should go
collections: # A list of collections the CMS should be able to edit
  - slug: "post" # Used in routes, ie.: /admin/collections/:slug/edit
    label: "Post" # Used in the UI, ie.: "New Post"
    folder: "_posts" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    fields: # The fields each document in this collection have
      - {label: "Title", name: "title", widget: "string", tagname: "h1"}
      - {label: "Body", name: "body", widget: "markdown"}
      - {label: "Foo", name: "foo", widget: "foo"}
```

Right now Netlify CMS only supports collections (a folder with files that can be
edited). In the future it'll also support single documents.

Each collection have a list of fields, where each field has a `label`, a `name`
and a `widget`.

## Widgets

Actual content editing happens with a side by side view where each `widget` has
a control for editing and a preview to give the content editor an idea of how the
content will look in the context of the published site.

Currently these widgets are built-in:

* **string** A basic text input
* **markdown** A markdown editor
* **checkbox** A simple checkbox
* **date** A date input
* **number** A number
* **hidden** Useful for setting a default value with a hidden field
* **image** An uploaded image
* **files** A multi file uploader
* **list** A list of objects, takes it's own array of fields describing the individual objects

## Extending and overriding

It's easy to add a custom template for either the preview or the control part of
a widget by adding handlebars templates in your `/admin/index.html`.
