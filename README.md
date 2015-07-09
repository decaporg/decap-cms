# Netlify CMS

A CMS for static site generators. Give non-technical users a simple way to edit
and add content to any site built with a static site generator.

Try the UI demo here: [cms.netlify.com](https://cms.netlify.com).

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
  <link rel="stylesheet" href="//cms.netlify.com/assets/cms.css" />
  <!-- Include a CMS specific stylesheet here -->

  <base href="/admin/">
</head>
<body>
  <script src="//cms.netlify.com/assets/vendor.js"></script>
  <script src="//cms.netlify.com/assets/cms.js"></script>
</body>
</html>
```

Add a `config.yml` file to the `/admin` folder and configure your content model:

```yaml
backend:
  name: github-api
  repo: owner/repo # Path to your Github repository
  branch: master # Branch to update (master by default)

media_folder: "img/uploads" # Folder where user uploaded files should go

collections: # A list of collections the CMS should be able to edit
  - name: "post" # Used in routes, ie.: /admin/collections/:slug/edit
    label: "Post" # Used in the UI, ie.: "New Post"
    folder: "_posts" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    fields: # The fields each document in this collection have
      - {label: "Title", name: "title", widget: "string", tagname: "h1"}
      - {label: "Body", name: "body", widget: "markdown"}
      - {label: "Foo", name: "foo", widget: "foo"}
    meta: # Meta data fields. Just like fields, but without any preview element
      - {label: "Publish Date", name: "date", widget: "datetime"}
```

Right now Netlify CMS only supports collections (a folder with files that can be
edited). In the future it'll also support single documents.

Each collection have a list of fields, where each field has a `label`, a `name`
and a `widget`.

## GitHub as a Backend

The defauly Github based authenticator integrates with Netlify's [Authentication Provider feature](https://www.netlify.com/docs/authentication-providers) and the repository
backend integrates directly with Github's API.

To get everything hooked up, setup continuous deployment from Github to Netlify
and then follow [the documentation](https://www.netlify.com/docs/authentication-providers)
to setup Github as an authentication provider.

That's it, now you should be able to go to the `/admin` section of your site and
log in.

## Local git backend

If you don't have a Github repo or just wan't to work locally, netlify CMS also
has a local version of the Github api that you can run from any repo on your machine.

Grab it from [https://github.com/netlify/netlify-git-api/releases](the netlify-git-api repo),
follow the installation instructions, then CD into the repo with your site and run:

```bash
netlify users add
netlify-git-api serve
```

This will add a new user and start serving an API for your repo.

Configure the backend like this in your `config.yml`:

```yaml
backend:
  name: netlify-api
  url: localhost:8080
```

## Widgets

Actual content editing happens with a side by side view where each `widget` has
a control for editing and a preview to give the content editor an idea of how the
content will look in the context of the published site.

Currently these widgets are built-in:

* **string** A basic text input
* **markdown** A markdown editor
* **checkbox** A simple checkbox
* **date** A date input
* **datetime** A date and time input
* **number** A number
* **hidden** Useful for setting a default value with a hidden field
* **image** An uploaded image
* **list** A list of objects, takes it's own array of fields describing the individual objects

## Customizing the preview

You can customize how entries in a collection are previewed easily by adding a handlebars template in your `/admin/index.html`:

```html
<script type="text/x-handlebars" data-template-name='cms/preview/my-collection'>
  <h1>{{cms-preview field='title'}}</h1>
  <div class="photo">{{cms-preview field='image'}}</div>
  <div class="body">{{cms-preview field='body'}}</div>
</script>
```

The name of the template should be prefixed 'cms/preview/' and have the same name
as the collection you want to preview.

User the `{{cms-preview field='fieldname'}}` to insert the preview widget for a field.

You can use `{{entry.fieldname}}` to access the actual value of a field in the template.

## Extending and overriding

It's easy to add a custom template for either the preview or the control part of
a widget by adding handlebars templates in your `/admin/index.html`.

Each widget consists of two Ember components, a **widget control** and a **widget preview**.

You can overwrite the template for any widget control or preview like this:

```html
<script type="text/x-handlebars" data-template-name='cms/widgets/string-control'>
  <div class="form-group">
    <label>{{widget.label}}</label>
    {{input value=raw_value class="form-control"}}
  </div>
</script>
```

A typical handlebar template. Within the template you can access the actual
`widget` object that exposes the `label` and the `value` of the field.

You can also access the `field` property on the widget to access the raw field
object from the `config.yml`.

It also exposes an `entry` object that represents the full document that's being edited.
This can be useful if you need to combine various values in a preview template.

Here's a more advanced example of creating a new widget called `author` just by adding
custom templates:

```html
<script type="text/x-handlebars" data-template-name='cms/widgets/author-control'>
  <div class="form-group">
    <label>{{widget.label}}</label>
    {{view "select" content=widget.field.authors value=widget.value}}
  </div>
</script>

<script type="text/x-handlebars" data-template-name='cms/widgets/author-preview'>
  Written by
  <span class="author">{{widget.value}}</span>
  on
  <span class="date">{{time-format widget.entry.cmsDate 'LL'}}</span>
</script>
```

It can now be used in the `config.yml` like this:

```yaml
collections: # A list of collections the CMS should be able to edit
  - name: "post" # Used in routes, ie.: /admin/collections/:slug/edit
    label: "Post" # Used in the UI, ie.: "New Post"
    folder: "_posts" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    fields: # The fields each document in this collection have
      - {label: "Title", name: "title", widget: "string", tagname: "h1"}
      - {label: "Body", name: "body", widget: "markdown"}
      - {label: "Author", name: "author", widget: "author", authors: ["Matt", "Chris"]}
```

Here we use Ember's [Select View](http://emberjs.com/api/classes/Ember.Select.html)
to let the user pick one of two authors and we use a custom preview to show the
output like: `Written by Matt on April 29, 2015`.

Netlify CMS includes [a date helper plugin](https://github.com/johnotander/ember-cli-dates)
so you can easily format dates with the `{{time-format}}` helper via [moment.js's](http://momentjs.com/)
formatting shortcuts.


### Coming Soon:

Docs on creating custom widget components, file formats, etc...

This is obviously still early days for Netlify CMS, there's a long list of features
and improvements on the roadmap.
