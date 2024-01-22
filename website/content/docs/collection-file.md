---
group: Collections
weight: 20
title: File Collections
---

Collections with type `files` displays in the left sidebar of the Content page of the editor UI along with other types.

A `files` collection contains one or more uniquely configured files. Unlike items in `folder` collections, which repeat the same configuration over all files in the folder, each item in a `files` collection has an explicitly set path, filename, and configuration. This can be useful for unique files with a custom set of fields, like a settings file or a custom landing page with a unique content structure.

When configuring a `files` collection, configure each file in the collection separately, and list them under the `files` field of the collection. Each file has its own list of `fields` and a unique filepath specified in the `file` field (relative to the base of the repo).

**Note:** Files listed in a file collection must already exist in the hosted repository branch set in your Decap CMS [backend configuration](/docs/backends-overview). Files must also have a valid value for the file type. For example, an empty file works as valid YAML, but a JSON file must have a non-empty value to be valid, such as an empty object.

Example:

```yaml
collections:
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

