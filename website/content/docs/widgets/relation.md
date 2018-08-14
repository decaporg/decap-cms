---
label: "Relation"
target: relation
---

The relation widget allows you to reference items from another collection. It provides a search input with a list of entries from the collection you're referencing, and the list automatically updates with matched entries based on what you've typed.

- **Name:** `relation`
- **UI:** text input with search result dropdown
- **Data type:** data type of the value pulled from the related collection item
- **Options:**
  - `default`: accepts any widget data type; defaults to an empty string
  - `collection`: (**required**) name of the collection being referenced (string)
  - `displayFields`: list of one or more names of fields in the referenced collection that will render in the autocomplete menu of the control. Defaults to `valueField`.
  - `searchFields`: (**required**) list of one or more names of fields in the referenced collection to search for the typed value
  - `valueField`: (**required**) name of the field from the referenced collection whose value will be stored for the relation
- **Example** (assuming a separate "authors" collection with "name" and "twitterHandle" fields):
    ```yaml
    - label: "Post Author"
      name: "author"
      widget: "relation"
      collection: "authors"
      searchFields: ["name", "twitterHandle"]
      valueField: "name"
      displayFields: ["twitterHandle", "followerCount"]
    ```
  The generated UI input will search the authors collection by name and twitterHandle, and display each author's handle and follower count. On selection, the author name will be saved for the field.
