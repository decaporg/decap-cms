---
title: list
label: List
description: >-
  The list widget allows you to create a repeatable item in the UI which saves
  as a list of widget values. map a user-provided string with a comma delimiter
  into a list. You can choose any widget as a child of a list widget—even other
  lists.
ui: >-
  if `fields` is specified, field containing a repeatable child widget, with
  controls for adding, deleting, and re-ordering the repeated widgets; if
  unspecified, a text input for entering comma-separated values
data_type: list of widget values
options:
  - description: >-
      if `fields` is specified, declare defaults on the child widgets; if not,
      you may specify a list of strings to populate the text field
    name: default
  - description: 'if added and labeled `false`, button to add additional widgets disappears'
    name: allow_add
  - description: a single widget field to be repeated
    name: field
  - description: >-
      a nested list of multiple widget fields to be included in each repeatable
      iteration
    name: fields
examples:
  - content: |-
      ```yaml
      - label: "Tags"
        name: "tags"
        widget: "list"
        default: ["news"]
      ```
    heading: '`field`/`fields` not specified'
  - content: |-
      ```yaml
        - label: "Tags"
          name: "tags"
          widget: "list"
          allow_add: false
          default: ["news"]
      ```
    heading: '`allow_add` marked `false`'
  - content: |
      ```yaml
      - label: "Gallery"
        name: "galleryImages"
        widget: "list"
        field:
          - {label: Image, name: image, widget: image}
      ```
    heading: with `field`
  - content: |-
      ```yaml
        - label: "Testimonials"
          name: "testimonials"
          widget: "list"
          fields:
            - {label: Quote, name: quote, widget: string, default: "Everything is awesome!"}
            - label: Author
              name: author
              widget: object
              fields:
                - {label: Name, name: name, widget: string, default: "Emmet"}
                - {label: Avatar, name: avatar, widget: image, default: "/img/emmet.jpg"}
      ```
    heading: with `fields`
---

