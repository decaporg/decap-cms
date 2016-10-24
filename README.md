# Netlify CMS

A CMS for static site generators. Give non-technical users a simple way to edit
and add content to any site built with a static site generator.

Netlify CMS is released under the [MIT License](LICENSE).
Please make sure you understand its [implications and guarantees](https://writing.kemitchell.com/2016/09/21/MIT-License-Line-by-Line.html).

## How it works

Netlify CMS is a single-page app that you pull into the `/admin` part of your site.

It presents a clean UI for editing content stored in a Git repository.

You setup a YAML config to describe the content model of your site, and typically
tweak the main layout of the CMS a bit to fit your own site.

When a user navigates to `/admin` she'll be prompted to login, and once authenticated
she'll be able to create new content or edit existing content.


## Installing

Netlify CMS is a React app. To install it in your site, add an `/admin` folder in
your public directory and use this `index.html` as a template:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Content Manager</title>
  <!-- Include the stylesheets from your site here -->
  <link rel="stylesheet" href="https://unpkg.com/netlify-cms@^0.1.1/dist/cms.css" />
  <!-- Include a CMS specific stylesheet here -->

</head>
<body>
  <script src="https://unpkg.com/netlify-cms@^0.1.1/dist/cms.js"></script>
</body>
</html>
```

> Note: Unpkg is a CDN for javascript modules, and it let's you point to semantic versions of files using prefix characters (so backwards-compatible bug fixes will loaded as soon as they're made available).


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

Each collection has a list of fields (or files with their individual fields). Each field has a `label`, a `name` and a `widget`.

Setting up the right collections is the main part of integrating netlify CMS with your site. It's where you decide exactly what content editors can work with, and what widgets should be used to edit each field of your various files or content types.

### GitHub as a Backend

The default Github-based authenticator integrates with Netlify's [Authentication Provider feature](https://www.netlify.com/docs/authentication-providers) and the repository
backend integrates directly with Github's API.

To get everything hooked up, setup continuous deployment from Github to Netlify
and then follow [the documentation](https://www.netlify.com/docs/authentication-providers)
to setup Github as an authentication provider.

That's it, now you should be able to go to the `/admin` section of your site and
log in.

### Media folder and Public folder

Most static file generators, except from Jekyll, don't keep the files that'll be
copied into the build folder when generating in their root folder.

This can create a problem for image and file paths when uploaded through the CMS.

Use the `public_folder` setting in `config.yml` to tell the CMS where the public
folder is located in the sources. A typical Middleman setup would look like this:

```yml
media_folder: "source/uploads" # Media files will be stored in the repo under source/uploads
public_folder: "source" # CMS now knows 'source' is the public folder and will strip this from the path
```

### Widgets

Actual content editing happens with a side by side view where each `widget` has
a control for editing and a preview to give the content editor an idea of how the
content will look in the context of the published site.

Currently these widgets are built-in:

* **string** A basic text input
* **markdown** A markdown editor
* **datetime** A date and time input
* **image** An uploaded image


## Extending Netlify CMS
The Netlify CMS exposes an `window.CMS` global object that you can use to register custom widgets, previews and editor plugins. The available methods are:

* **registerPreviewStyle** Register a custom stylesheet to use on the preview pane.
* **regsiterPreviewTemplate** Registers a template for a collection.
* **registerWidget** lets you register a custom widget.

**Writing React Components inline**

Both regsiterPreviewTemplate and registerWidget requires you to provide a React component. If you have a build process in place for your project, it is possible to integrate webpack and Babel for a complete React build flow.

Although possible, it may be cumbersome or even impractical to add a React build phase. For this reason, Netlify CMS exposes two React constructs globally to allow you to create components inline: ‘createClass’ and ‘h’ (alias for React.createElement).


### `registerPreviewStyle`

Register a custom stylesheet to use on the preview pane.

`CMS.registerPreviewStyle(file);`

**Params:**

* file: css file path.

**Example:**

`CMS.registerPreviewStyle("/example.css");`


### `regsiterPreviewTemplate`

Registers a template for a collection.

`CMS.registerPreviewTemplate(collection, react_component);`

**Params:**

* collection: The name of the collection which this preview component will be used for.
* react_component: A React component that renders the collection data. Three props will be passed to your component during render:
  * entry: Immutable collection containing the entry data.
  * widgetFor: Returns the appropriate widget preview component for a given field.
  * getMedia: Returns the correct filePath or in-memory preview for uploaded images.

**Example:**

```html
<script>
var PostPreview = createClass({
  render: function() {
    var entry = this.props.entry;
    var image = entry.getIn(['data', 'image']);
    var bg = this.props.getMedia(image);
    return h('div', {},
      h('h1', {}, entry.getIn(['data', 'title'])),
      h('img', {src: bg.toString()}),
      h('div', {"className": "text"}, this.props.widgetFor('body'))
    );
  }
});

CMS.registerPreviewTemplate("posts", PostPreview);
</script>
```

### `registerWidget`

lets you register a custom widget.

`CMS.registerWidget(field, control, [preview])`

**Params:**

* field: The field type which this widget will be used for.
* control: A React component that renders the editing interface for this field. Two props will be passed:
  * value: The current value for this field.
  * onChange: Callback function to update the field value.
* preview (optional): A React component that renders the preview of how the content will look. A `value` prop will be passed to this component.


**Example:**

```html
<script>
var CategoriesControl = createClass({
  handleChange: function(e) {
    this.props.onChange(e.target.value.split(',').map((e) => e.trim()));
  },

  render: function() {
    var value = this.props.value;
    return h('input', { type: 'text', value: value ? value.join(', ') : '', onChange: this.handleChange });
  }
});

CMS.registerWidget('categories', CategoriesControl);
</script>
```


## Coming Soon:

More built-in Widgets, CMS registry extendability endpoints, Docs on file formats, internal APIs etc...

This is obviously still early days for Netlify CMS, there's a long list of features
and improvements on the roadmap.
