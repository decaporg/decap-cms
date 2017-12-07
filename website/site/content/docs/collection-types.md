---
title: Collection Types
position: 27
---

# Collection Types

All editable content types are defined in the `collections` field of your `config.yml` file, and display in the left sidebar of the Content page of the editor UI.

Collections come in two main types: `folder` and `file`.


## Folder collections

Folder collections represent one or more files with the same format, fields, and configuration options, all stored within the same folder in the repository. You might use a folder collection for blog posts, product pages, author data files, etc.

Unlike file collections, folder collections have the option to allow editors to create new items in the collection. This is set by the boolean `create` field.

Example:

```yaml
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

### Filtered folder collections

The entries for any folder collection can be filtered based on the value of a single field. By filtering a folder into different collections, you can manage files with different fields, options, extensions, etc. in the same folder.

The `filter` option requires two fields:

- `field`: the name of the collection field to filter on
- `value`: the desired field value

The example below creates two collections in the same folder, filtered by the `language` field. The first collection includes posts with `language: en`, and the second, with `language: es`.

``` yaml
collections:
  - label: "Blog in English"
    name: "english_posts"
    folder: "_posts"
    filter: {field: "language", value: "en"}
    fields:
      - {label: "Language", name: "language", widget: "select", options: ["en", "es"]}
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Content", name: "body", widget: "markdown"}      
  - label: "Blog en Español"
    name: "spanish_posts"
    folder: "_posts"
    filter: {field: "language", value: "es"}
    fields:
      - {label: "Lenguaje", name: "language", widget: "select", options: ["en", "es"]}
      - {label: "Titulo", name: "title", widget: "string"}
      - {label: "Contenido", name: "body", widget: "markdown"}      
```


## File collections

File collections represent a single file or grouping of files, useful for unique files with a custom set of fields.

### Single `file`

Use `file` to specify a single file "collection". The value is a path to the file to be edited, relative to the base of the repository.

Example using `file`:

```yaml
- label: "Site Settings"
  name: "general"
  file: "site/_data/settings.json"
  extension: "json"
  description: "General Site Settings"
  fields:
      - {label: "Global title", name: "site_title", widget: "string"}
      - label: "Post Settings"
        name: "posts"
        widget: "object"
        fields:
            - {label: "Number of posts on frontpage", name: front_limit, widget: number}
            - {label: "Default Author", name: author, widget: string}
            - {label: "Default Thumbnail", name: thumb, widget: image, class: "thumb"}
```

### Multiple `files`

You can group multiple files together under a single item in the collection list by using the `files` option. The option takes a list of single `file`-type collections.

Example using `files`:

``` yaml
- label: "Pages"
  name: "pages"
  files:
    - label: "About Page"
      name: "about"
      file: "site/content/about.yml"
      fields:
        - {label: Title, name: title, widget: string}
        - {label: Intro, name: intro, widget: markdown}
        - label: Team
          name: team
          widget: list
          fields:
            - {label: Name, name: name, widget: string}
            - {label: Position, name: position, widget: string}
            - {label: Photo, name: photo, widget: image}
    - label: "Locations Page"
      name: "locations"
      file: "site/content/locations.yml"
      fields:
        - {label: Title, name: title, widget: string}
        - {label: Intro, name: intro, widget: markdown}
        - label: Locations
          name: locations
          widget: list
          fields:
            - {label: Name, name: name, widget: string}
            - {label: Address, name: address, widget: string}
```