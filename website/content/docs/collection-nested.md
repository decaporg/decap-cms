---
group: Collections
weight: 30
title: Nested Collections (beta)
---

There is beta support for Folder Collections which can also handle `nested` folder structures.

Nested collections is a beta feature that allows a folder collection to show a nested structure of entries and edit the locations of the entries. This feature is useful when you have a complex folder structure and may not want to create separate collections for every directory. As it is in beta, please use with discretion.

Example configuration:

```yaml
collections:
  - name: pages
    label: Pages
    label_singular: 'Page'
    folder: content/pages
    create: true
    # adding a nested object will show the collection folder structure
    nested:
      depth: 100 # max depth to show in the collection tree
      summary: '{{title}}' # optional summary for a tree node, defaults to the inferred title field
    fields:
      - label: Title
        name: title
        widget: string
      - label: Body
        name: body
        widget: markdown
    # adding a meta object with a path property allows editing the path of entries
    # moving an existing entry will move the entire sub tree of the entry to the new location
    meta: { path: { widget: string, label: 'Path', index_file: 'index' } }
```

Nested collections expect the following directory structure:

```bash
content
└── pages
    ├── authors
    │   ├── author-1
    │   │   └── index.md
    │   └── index.md
    ├── index.md
    └── posts
        ├── hello-world
        │   └── index.md
        └── index.md
```
