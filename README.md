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

## Quick Start

The easiest way to get started playing around with netlify CMS, is to clone one of
our starter templates and start hacking:

* [Jekyll + netlify CMS](https://github.com/netlify-templates/jekyll-netlify-cms)
* [Roots + netlify CMS](https://github.com/netlify-templates/roots-netlify-cms)
* [Hexo + netlify CMS](https://github.com/netlify-templates/hexo-netlify-cms)
* [Pelican + netlify CMS](https://github.com/netlify-templates/pelican-netlify-cms)

## Installing

Netlify CMS is an Ember app. To install it in your site, add an `/admin` folder in
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
  - name: "settings"
    label: "Settings"
    files:
      - name: "general"
        label: "General settings"
        file: "_settings/general.json"
        fields:
          - {label: "Main site title", name: "site_title", widget: "string"}
          - {label: "Number of fronpage posts", name: "post_count", widget: "number"}
          - {label: "Site cover image", name: "cover", widget: "image"}
```

Netlify CMS works with the concept of collections of documents that a user can edit.

Collections basically comes in three forms:

1. A `folder`. Set the `folder` attribute on the collection. Each document will be a
   file in this folder. Each document will have the same format, fields and meta fields.
2. A list of `files`. Set the `files` attribute on the collection. You can set fields that
   all files in the folder shares directly on the collection, and set specific fields for
   each file. This is great when you have files with a different structure.
3. A `file`. **Warning, not implemented yet**. This is a collection stored in a single file.
   Typically a YAML file or a CSV with an array of items.

Each collection have a list of fields (or files with their individual fields). Each field has a `label`, a `name` and a `widget`.

Setting up the right collections is the main part of integrating netlify CMS with your site. It's
where you decide exactly what content editors can work with, and what widgets should be used to
edit each field of your various files or content types.

## Environments

Often it's useful to have a few different environments defined in your config. By default the config
will be loaded as is, but if you set a global CMS_ENV variable in a script tag in your admin/index.html,
any attributes in that environment will take precedence over the default attributes.

Example:

```yaml
backend:
  name: netlify-api
  url: http://localhost:8080

production:
  backend: github-api
  repo: netlify/netlify-home
  branch: master

# rest of the config here...
```

Now when working locally, the CMS will use a local instance of the [netlify git API](https://github.com/netlify/netlify-git-api), but if you make sure to set `window.CMS_ENV="production"` in your production builds, then the CMS will work on Github's API in production.


## Defining the config directly in your admin/index.html

Some Static Site Generators (looking at you Hexo) won't copy a config.yml from
the admin folder into the build when generating a site. As an alternative you can
embed the config.yml directly in the `admin/index.html` file like this:

```html
<script type="application/x-yaml" id="cms-yaml-config">
# Config YAML goes here...
</script>
```


## GitHub as a Backend

The default Github based authenticator integrates with Netlify's [Authentication Provider feature](https://www.netlify.com/docs/authentication-providers) and the repository
backend integrates directly with Github's API.

To get everything hooked up, setup continuous deployment from Github to Netlify
and then follow [the documentation](https://www.netlify.com/docs/authentication-providers)
to setup Github as an authentication provider.

That's it, now you should be able to go to the `/admin` section of your site and
log in.


## Local git backend

If you don't have a Github repo or just wan't to work locally, netlify CMS also
has a local version of the Github api that you can run from any repo on your machine.

Grab it from [the netlify-git-api repo](https://github.com/netlify/netlify-git-api/releases),
follow the installation instructions, then CD into the repo with your site and run:

```bash
netlify-git-api users add
netlify-git-api serve
```

This will add a new user and start serving an API for your repo.

Configure the backend like this in your `config.yml`:

```yaml
backend:
  name: netlify-api
  url: http://localhost:8080
```


## Media folder and Public folder

Most static file generators, except from Jekyll, don't keep the files that'll be
copied into the build folder when generating in their root folder.

This can create a problem for image and file paths when uploaded through the CMS.

Use the `public_folder` setting in `config.yml` to tell the CMS where the public
folder is located in the sources. A typical Middleman setup would look like this:

```yml
media_folder: "source/uploads" # Media files will be stored in the repo under source/uploads
public_folder: "source" # CMS now knows 'source' is the public folder and will strip this from the path
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
* **object** An object with it's own set of fields
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

For widgets like markdown fields or images, you'll typically always want to use the {{cms-preview field='body'}} format, since otherwise you'll get the raw value of the field, rather than the
HTML value.


## List or Object Widgets and Custom Previews

The list widget is very powerful and allow you to have a list of structured object within an entry, that can be reordered via drag and drop.

Here's a basic example of an entry in a file based collection that lets the user edit a list of authors.

**config.yml**
```yaml
collections:
  - name: "settings"
    label: "Settings"
      - name: "authors"
        label: "Authors"
        file: "_data/authors.yml"
        description: "Author descriptions"
        fields:
          - name: authors
            label: Authors
            widget: list
            fields:
              - {label: "Name", name: "name", widget: "string"}
              - {label: "Description", name: "description", widget: "markdown"}
```

This will let the user edit a list of authors that each have a Name and a Description.

When configuring a custom preview for this entry, it's important to treat the list field a bit different than normal values on the entry, to make sure you can get the right output from `{{cms-preview}}` within the list:

```html
<script type="text/x-handlebars" data-template-name='cms/preview/authors'>
  {{#cms-preview field="authors" as |author|}}
    <div class="author">
      <h2>{{author.name}}</h2>
      <div class="description">{{cms-preview field="description" from=author}}</div>
    </div>
  {{/cms-preview}}
</script>
```

Note that for the list widget, we're using the `cms-preview` tag in a new way, to iterate over
each item in the list, and when using `cms-preview` for a specific item, we're setting a `from` attribute to make sure we're showing the preview of the `description` for that specific author, and not a global `description` field from the entry itself.

The same rule applies when using a single object widget to group various fields together. You'll need this when editing data with nested keys like this:

```json
{"posts": {"frontpage_limit": 5, "author": "Jon Doe"}}
```

As a field in a configuration file, this would look like:

```yml
- label: "Post settings"
  name: posts
  widget: object
  fields:
    - {label: "Number of posts on front page", name: "frontpage_limit", widget: "number"}
    - {label: "Default Author", name: "author", widget: "string"}
```

And to setup a custom preview template for this, you would again use the "cms-preview" component:

```html
{{#cms-preview field="posts" as |posts|}}
<p>Number on frontpage: {{posts.frontpage_limit}}</p>
<p>Default Author: {{posts.author}}</p>
{{/cms-preview}}
```

Again we're using the cms-preview to get us access to the inner object. You could use `{{entry.posts.frontpage_limit}}` as well in simple cases, but once you have nested values that needs
more complex preview rendering (such as image or markdown widgets), you'll want to use this technique
to make sure you get the right kind of object in scope.

## Escaping handlebars tags in Jekyll/Hexo

Some static site generators, like Jekyll or Hexo, will try to parse the handlebar tags in your templates. Both of these use the following syntax to use raw HTML:

```html
{% raw %}
<script type="text/x-handlebars" data-template-name='cms/preview/my-collection'>
  <h1>{{cms-preview field='title'}}</h1>
  <div class="photo">{{cms-preview field='image'}}</div>
  <div class="body">{{cms-preview field='body'}}</div>
</script>
{% endraw %}
```

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

Netlify CMS includes a time format helper so you can easily format dates with the `{{time-format}}` helper via [moment.js's](http://momentjs.com/) formatting shortcuts.

```html
{{time-format entry.date ""}}
```

### Template Helpers

When writing preview templates or widget templates, you can use any component or helper normally available in Ember apps, but apart from that netlify CMS adds a few extra helpers:

#### Time format

Netlify CMS has a built-in time-format helper for formatting date and time with the formatting syntax from [moment.js](http://momentjs.com/).

```html
<h2>Date: {{ time-format entry.date "dddd, MMMM Do YYYY, h:mm:ss a"}}</h2>
```

This would output something like:

```html
<h2> Date: Friday, August 14th 2015, 2:12:34 pm</h2>
```

### Custom Widgets

Netlify CMS can easily be extended with custom widgets.

Each widget consists of two Ember Components.

1. Widget Control Component
   Used on the left site of the CMS as the input for the field value.
2. Widget Preview Component
   Not always necesarry (will always fall back to a simple string preview), but for advanced widgets like the markdown editor, etc, a preview widget is needed to format the output of the field right.

#### Creating your own widget

As a small example, we'll look at how creating a "color" widget that'll let us define a field like this:

```yml
{"label": "color", "name": "color", "widget": "color"}
```

And then get a nice color picker.

The bare minimum for creating your own widget, is to create a widget template. Lets add this to our `admin/index.html`:

```html
<script type="text/x-handlebars" data-template-name='components/widgets/color-control'>
  {{input value=widget.value type="color"}}
</script>
```

That's actually all it take for a really simple widget. Now any browser that implements `<input type="color">` will show a color picker and update the preview in realtime with the value as we make changes.

Widget components have access to a `widget` object. For all the details on this object, [read the source code documentation](/app/models/widget.js).

Most of the time, you'll need to also add some custom behavior to your component that can't be handle by a handlebars template alone.

Lets try to write a color picker widget based on the [jQuery spectrum color-picker](https://bgrins.github.io/spectrum/) instead of the browser's native color field.

First we make sure to include the assets needed for spectrum.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.7.1/spectrum.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.7.1/spectrum.min.css"></link>
```

Now that we have spectrum loaded, we need to make sure we initialize the plugin when our component is added to the DOM and cleanup when it's removed.

We'll start by changing our component template a bit:

```html
<script type="text/x-handlebars" data-template-name='components/widgets/color-control'>
  <input type='text' class="cms-color-control"/>
</script>
```

Instead of the built-in Ember input component, we'll just output a normal input tag that we can use as the element we attach spectrum to.

To add the logic for our control component, we call `CMS.WidgetControl(componentName, implementation)`. For those familiar with Ember, this is the same as creating a new Ember component via `Ember.Component.extend(implementation)`.

Here's the full Spectrum color picker control component (make sure to add this after the script tag that includes the CMS JavaScript):

```html
<script>
// Create the Control component fro the "color" widget
CMS.WidgetControl("color", {
  // We want this component to wrap it's template in a "div" so we can use
  // this.$(...) to access the template DOM
  tagName: "div",

  // willInsertElement is a standard Ember callback that gets invoked when
  // our component is inserted into the DOM
  willInsertElement: function() {
    var widget = this.get("widget");
    // Setup spectrum with an initial value from the widget, and make sure
    // we update the value when the user picks a color
    this.$("input").spectrum({
      color: this.get("widget.value"),
      change: function(color) {
        widget.set("value", color.toHexString());
      }
    });
  },

  // willDestroyElement is a standard Ember callback that gets invoked when
  // our component is about to be removed from the DOM
  willDestroyElement: function() {
    this.$("input").spectrum("destroy");
  }
});
</script>
```

That's it - now we'll get a nice spectrum color picker.

By default the default preview for this widget will simply output a string with the color value.

The simplest way to customize the preview, is to just create a preview template:

```html
<script type="text/x-handlebars" data-template-name='components/widgets/color-preview'>
  <div class="cms-color-preview" style="background: {{widget.value}};">{{widget.value}}</div>
</script>
```

Just like with the control part of our widget, we can also add some logic to our preview component.

In some cases it might be impossible to actually read the widget.value if the color of the text and the background gets too close. Lets add a bit of logic to always use the inverted color of the current value to show the color string.

First we update our template a bit:

```html
<script type="text/x-handlebars" data-template-name='components/widgets/color-preview'>
  <div class="cms-color-preview" style="background: {{widget.value}};">
    <p style="color: {{invertedColor}}">{{widget.value}}</p>
  </div>
</script>
```

Now we create a preview component for our color widget:

```html
<script>
CMS.WidgetPreview("color", {
  invertedColor: function() {
    var color = this.get("widget.value") || "#fff";
    color = color.substring(1);           // remove #
    color = parseInt(color, 16);          // convert to integer
    color = 0xFFFFFF ^ color;             // invert three bytes
    color = color.toString(16);           // convert to hex
    color = ("000000" + color).slice(-6); // pad with leading zeros
    color = "#" + color;                  // prepend #
    return color;
  }.property("widget.value")
});
</script>
```

Just as with CMS.WidgetControl, this is the same as defining a new Ember Component via `Ember.Component.extend(implementation)`. An important part of Ember is computed properties. In this case we define a function `invertedColor` and use `.property("widget.value")` to make this a computed property that depends on `widget.value`. This way it'll get recomputed every time `widget.value` changes, and we can use `invertedColor` in our handlebars template.



### Coming Soon:

Docs on file formats, internal APIs etc...

This is obviously still early days for Netlify CMS, there's a long list of features
and improvements on the roadmap.
