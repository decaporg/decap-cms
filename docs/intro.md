# Introduction

Netlify CMS is a Content Management System for static sites, allowing collaborators to create, edit, review, and publish content without writing code or dealing with version control. It brings the ease of WordPress-style editing to the simplicity and speed of static sites.

At its core, Netlify CMS is an open-source React app that acts as a wrapper for the Git workflow, using the GitHub API. This allows for many advantages, including:

* **Fast, web-based UI** - with rich-text editing, real-time preview, and drag-and-drop media uploads
* **Platform agnostic** - works with most static site generators
* **Easy installation** - add two files to your site and hook up the backend by including in your build process or linking to our CDN
* **Modern authentication** - using GitHub and JSON web tokens
* **Flexible content types** - specify an unlimited number of content types with custom fields
* **Fully extensible** - create custom-styled previews, UI widgets, and editor plugins

# Core Concepts

## The Admin Interface

The admin interface is a single-page app with the entry point stored in a static `/admin` folder you add to the root of your site. You can include it with a simple `index.html` file that loads the necessary CSS and JS files from from a CDN:

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

The JS is also available via npm and can be integrated into your regular build process.

### Editorial Workflow

Netlify CMS has an optional [editorial workflow](https://github.com/netlify/netlify-cms/blob/master/docs/editorial-workflow.md) that translates common Git commands into familiar language in a simple UI:

Actions in Netlify UI...	| Perform these Git actions
--- | ---
Save draft | Commits to a new branch, and opens a pull request
Edit draft | Pushes another commit to the draft branch/pull request
Approve and publish draft | Merges pull request and deletes branch

## Configuration

All configuration is handled in a single `config.yml` file, also stored in the `/admin` folder. A simple version might look like this:

``` yaml
backend:
  name: github
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
      - {label: "Publish Date", name: "date", widget: "datetime"}
```

### Backend

Because Netlify CMS is a wrapper for the GitHub API, the "backend" is a repo stored on GitHub. *(Using a different Git host? File a [feature request](https://github.com/netlify/netlify-cms/issues), or [help us add it](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md)!)* For authentication, you can connect to GitHub using Netlify’s [Authentication Provider feature](https://www.netlify.com/docs/authentication-providers), or you can roll your own.  

### Collections

All content managed by Netlify CMS is organized in Collections—groups of files such as:

* blog posts
* portfolio samples
* product listings
* podcast episodes

You point to where the files are stored, and specify the fields that define them. The `body` field typically stores the main text of a file, while any other fields are included at the top of the document in the front matter. They can be required, optional, or hidden, and can have preset defaults. 

### Widgets

Widgets define the data type and interface for entry fields. Netlify CMS comes with several built-in widgets, including:

Widget | UI | Data Type
--- | --- | ---
`string` | text input | string
`text` | text area input | plain text, multiline input
`number` | text input with `+` and `-` buttons | number
`markdown` | rich text editor with raw option | markdown-formatted string
`datetime` | date picker widget | ISO date string
`image` | file picker widget with drag-and-drop | file path saved as string, image uploaded to media folder
`hidden` | No UI | Hidden element, typically only useful with a `default` attribute

We’re always adding new widgets, and you can also create your own.

## Customization

Netlify CMS exposes a `window.CMS` global object that you can use to register custom widgets, previews, and editor plugins. The available methods are:

* `registerPreviewStyle` - register a custom stylesheet to match the editor preview pane to your site style

* `registerPreviewTemplate` - registers a template to determine how fields are displayed in the preview, customizable for each collection

* `registerWidget` - registers a custom widget

* `registerEditorComponent` - adds a block component to the Markdown editor

