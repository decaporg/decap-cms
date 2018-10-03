---
title: relation
label: Relation
description: >-
  The relation widget allows you to reference items from another collection. It
  provides a search input with a list of entries from the collection you're
  referencing, and the list automatically updates with matched entries based on
  what you've typed.
ui: text input with search result dropdown
data_type: data type of the value pulled from the related collection item
options:
  - description: accepts any widget data type; defaults to an empty string
    name: default
  - description: (**required**) name of the collection being referenced (string)
    name: collection
  - description: >-
      list of one or more names of fields in the referenced collection that will
      render in the autocomplete menu of the control. Defaults to `valueField`.
    name: displayFields
  - description: >-
      (**required**) list of one or more names of fields in the referenced
      collection to search for the typed value
    name: searchFields
  - description: >-
      (**required**) name of the field from the referenced collection whose
      value will be stored for the relation
    name: valueField
examples:
  - content: >-
      (assuming a separate "authors" collection with "name" and "twitterHandle"
      fields):

      ```yaml

      - label: "Post Author"
        name: "author"
        widget: "relation"
        collection: "authors"
        searchFields: ["name", "twitterHandle"]
        valueField: "name"
        displayFields: ["twitterHandle", "followerCount"]
      ```

      The generated UI input will search the authors collection by name and
      twitterHandle, and display each author's handle and follower count. On
      selection, the author name will be saved for the field.
---

