---
label: "Relation"
title: relation
---

The relation widget allows you to reference items from another collection. It provides a search input with a list of entries from the collection you're referencing, and the list automatically updates with matched entries based on what you've typed.

- **Name:** `relation`
- **UI:** text input with search result dropdown
- **Data type:** data type of the value pulled from the related collection item
- **Options:**
  - `collection`: (**required**) name of the collection being referenced (string)
  - `valueField`: (**required**) name of the field from the referenced collection whose value will be stored for the relation. For nested fields, separate each subfield with a `.` (E.g. `name.first`).
  - `searchFields`: (**required**) list of one or more names of fields in the referenced collection to search for the typed value. Syntax to reference nested fields is similar to that of *valueField*.
  - `displayFields`: list of one or more names of fields in the referenced collection that will render in the autocomplete menu of the control. Defaults to `valueField`. Syntax to reference nested fields is similar to that of *valueField*.
  - `default`: accepts any widget data type; defaults to an empty string
  - `multiple` : accepts a boolean, defaults to `false`
  - `optionsLength`: accepts integer to override number of options presented to user. Defaults to `20`.
- **Example** (assuming a separate "authors" collection with "name" and "twitterHandle" fields with subfields "first" and "last" for the "name" field):

```yaml
- label: "Post Author"
  name: "author"
  widget: "relation"
  collection: "authors"
  searchFields: ["name.first", "twitterHandle"]
  valueField: "name.first"
  displayFields: ["twitterHandle", "followerCount"]
```

The generated UI input will search the authors collection by name and twitterHandle, and display each author's handle and follower count. On selection, the author name will be saved for the field.

- **Note:** `valueField` and `displayFields` support string templates. For example:

```yaml
- label: "Post Author"
  name: "author"
  widget: "relation"
  collection: "authors"
  searchFields: ['name.first']
  valueField: "{{slug}}"
  displayFields: ["{{twitterHandle}} - {{followerCount}}"]
```

The generated UI input will search the authors collection by name, and display each author's handle and follower count. On selection, the author entry slug will be saved for the field.
