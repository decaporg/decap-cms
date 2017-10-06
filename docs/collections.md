# Collections
Collections define the structure for the different content types on your static site. Since every site is different, the `collections` settings will be very different from one site to the next.

Let's say your site has a blog, with the posts stored in `_posts/blog`, and files saved in a date-title format, like `1999-12-31-lets-party.md`. Each post begins with settings in yaml-formatted front matter, like so:

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
  <td><code><em>files</em></code></td>
    <td>Where files of this type are stored, relative to the repo root. If you want to edit specific files, see the "Data Files" section below.</td>
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

As described above, the `widget` property specifies a built-in or custom UI widget for a given field. The first field in the example, `layout`, uses a `hidden` widget. This widget will not show in the editor UI, but will be saved with the `default` value (assuming it's been set) in the document front matter. The rest of the widgets work as follows:

Widget | UI | Data Type
--- | --- | ---
`string` | text input | string
`datetime` | date picker widget | ISO date string
`image` | file picker widget with drag-and-drop | file path saved as string, image uploaded to media folder
`number` | text input with `+` and `-` buttons | number
`markdown` | rich text editor with raw option | markdown-formatted string

Based on this example, you can go through the post types in your site and add the appropriate settings to your `config.yml` file. Each post type should be listed as a separate node under the `collections` field.

## Filter
The entries for any collection can be filtered based on the value of a single field. The example collection, below, would only show post entries with the value "en" in the language field.

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

## Files
If instead of editing all files in a folder, you have a pre-determined set of files, you can list the files in the collection config instead of specifying a `folder`. You can specifiy as many different files as you want per collection, and they can be any type supported (YAML, JSON, or Markdown).

``` yaml
collections:
  - name: "settings"
    label: "Settings"
    editor:
      preview: false
    files:
      - name: "general"
        label: "Site Settings"
        file: "_data/settings.json"
        description: "General Site Settings"
        fields:
          - {label: "Global title", name: "site_title", widget: "string"}
          - label: "Post Settings"
            name: posts
            widget: "object"
            fields:
              - {label: "Number of posts on frontpage", name: front_limit, widget: number}
              - {label: "Default Author", name: author, widget: string}
              - {label: "Default Thumbnail", name: thumb, widget: image, class: "thumb"}
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
