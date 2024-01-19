---
group: Collections
weight: 10
title: Folder Collections
---

Collections with type `folder` displays in the left sidebar of the Content page of the editor UI along with other types.

Folder collections represent one or more files with the same format, fields, and configuration options, all stored within the same folder in the repository. You might use a folder collection for blog posts, product pages, author data files, etc.

Unlike file collections, folder collections have the option to allow editors to create new items in the collection. This is set by the boolean `create` field.

Folder collections must have at least one field with the name `title` for creating new entry slugs. That field should use the default `string` widget. The `label` for the field can be any string value. If you wish to use a different field as your identifier, set `identifier_field` to the field name. See the [Collections reference doc](/docs/configuration-options/#collections) for details on how collections and fields are configured. If you forget to add this field, you will get an error that your collection "must have a field that is a valid entry identifier".

Example:

```yaml
collections:
  - label: "Blog"
    name: "blog"
    folder: "_posts/blog"
    create: true
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Featured Image", name: "thumbnail", widget: "image"}
      - {label: "Body", name: "body", widget: "markdown"}
```

With `identifier_field`:

```yaml
- label: "Blog"
  name: "blog"
  folder: "_posts/blog"
  create: true
  identifier_field: name
  fields:
    - {label: "Name", name: "name", widget: "string"}
    - {label: "Publish Date", name: "date", widget: "datetime"}
    - {label: "Featured Image", name: "thumbnail", widget: "image"}
    - {label: "Body", name: "body", widget: "markdown"}
```

### Filtered Folder Collections

The entries for any folder collection can be filtered based on the value of a single field. By filtering a folder into different collections, you can manage files with different fields, options, extensions, etc. in the same folder.

The `filter` option requires two fields:

* `field`: The name of the collection field to filter on.
* `value`: The desired field value.

The example below creates two collections in the same folder, filtered by the `language` field. The first collection includes posts with `language: en`, and the second, with `language: es`.

```yaml
collections:
  - label: "Blog in English"
    name: "english_posts"
    folder: "_posts"
    create: true
    filter: {field: "language", value: "en"}
    fields:
      - {label: "Language", name: "language", widget: "select", options: ["en", "es"]}
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Content", name: "body", widget: "markdown"}
  - label: "Blog en Español"
    name: "spanish_posts"
    folder: "_posts"
    create: true
    filter: {field: "language", value: "es"}
    fields:
      - {label: "Lenguaje", name: "language", widget: "select", options: ["en", "es"]}
      - {label: "Titulo", name: "title", widget: "string"}
      - {label: "Contenido", name: "body", widget: "markdown"}
```


### Folder Collections Path

By default the CMS stores folder collection content under the folder specified in the collection setting.

For example configuring `folder: posts` for a collection will save the content under `posts/post-title.md`.

You can now specify an additional `path` template (similar to the `slug` template) to control the content destination.

This allows saving content in subfolders, e.g. configuring `path: '{{year}}/{{slug}}'` will save the content under `posts/2019/post-title.md`.

### Media and Public Folder

By default the CMS stores media files for all collections under a global `media_folder` directory as specified in the configuration.

When using the global `media_folder` directory any entry field that points to a media file will use the absolute path to the published file as designated by the `public_folder` configuration.

For example configuring:

```yaml
media_folder: static/media
public_folder: /media
```

And saving an entry with an image named `image.png` will result in the image being saved under `static/media/image.png` and relevant entry fields populated with the value of `/media/image.png`.

Some static site generators (e.g. Gatsby) work best when using relative image paths.

This can now be achieved using a per collection `media_folder` configuration which specifies a relative media folder for the collection.

For example, the following configuration will result in media files being saved in the same directory as the entry, and the image field being populated with the relative path to the image.

```yaml
media_folder: static/media
public_folder: /media
collections:
  - name: posts
    label: Posts
    label_singular: 'Post'
    folder: content/posts
    path: '{{slug}}/index'
    media_folder: ''
    public_folder: ''
    fields:
      - label: Title
        name: title
        widget: string
      - label: 'Cover Image'
        name: 'image'
        widget: 'image'
```

More specifically, saving an entry with a title of `example post` with an image named `image.png` will result in a directory structure of:

```bash
content
  posts
    example-post
      index.md
      image.png
```

And for the image field being populated with a value of `image.png`.

**Note: When specifying a `path` on a folder collection, `media_folder` defaults to an empty string.**

**Available template tags:**

Supports all of the [`slug` templates](/docs/configuration-options#slug) and:

* `{{dirname}}` The path to the file's parent directory, relative to the collection's `folder`.
* `{{filename}}` The file name without the extension part.
* `{{extension}}` The file extension.
* `{{media_folder}}` The global `media_folder`.
* `{{public_folder}}` The global `public_folder`.
