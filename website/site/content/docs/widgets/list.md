---
label: "List"
target: "list"
type: "widget"
---

### List

The list widget allows you to create a repeatable item in the UI which saves as a list of widget values. map a user-provided string with a comma delimiter into a list. You can choose any widget as a child of a list widget—even other lists.

- **Name:** `list`
- **UI:**
  - if `fields` is specified, field containing a repeatable child widget, with controls for adding, deleting, and re-ordering the repeated widgets; if unspecified, a text input for entering comma-separated values
  - if `types` is specified, it is a list of widgets (modular content types) available to the user from the modular content dropdown. User selects a (or multiple) widgets to add to a list. Child widget is added to the list, with controls for adding, deleting, and re-ordering the child widgets;
- **Data type:** list of widget values
- **Options:**
  - `default`: if `fields` is specified, declare defaults on the child widgets; if not, you may specify a list of strings to populate the text field
  - `allow_add`: if added and labeled `false`, button to add additional widgets disapears
  - `field`: a single widget field to be repeated
  - `fields`: a nested list of multiple widget fields to be included in each repeatable iteration
  - `types`: a one-dimensional list of multiple widget types to be included in the dropdown

- **Example** (`field`/`fields` not specified):

  ```yaml
  - label: "Tags"
    name: "tags"
    widget: "list"
    default: ["news"]
  ```

- **Example** (`allow_add` marked `false`):

  ```yaml
  - label: "Tags"
    name: "tags"
    widget: "list"
    allow_add: false
    default: ["news"]
  ```

- **Example** (with `field`):

  ```yaml
  - label: "Gallery"
    name: "galleryImages"
    widget: "list"
    field:
      - {label: Image, name: image, widget: image}
  ```

- **Example** (with `fields`):

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
- **Example** (with `types`)

  ```yaml
  - label: "Modular Content Chunks"
        label_singular: "Modular Content Chunk"
        name: "chunk"
        widget: "modular"
        types:
          - {label: "Text", name: "text", widget: "text"}
          - {label: "String", name: "string", widget: "string"}
          - {label: "Boolean", name: "boolean", widget: "boolean"}
          - {label: "Number", name: "number", widget: "number"}
          - {label: "Markdown", name: "markdown", widget: "markdown"}
          - {label: "Datetime", name: "datetime", widget: "datetime"}
          - {label: "Date", name: "date", widget: "date"}
          - {label: "Image", name: "image", widget: "image"}
          - {label: "File", name: "file", widget: "file"}
          - {label: "Select", name: "select", widget: "select", options: ["a", "b", "c"]}
          - {label: "Select (Object)", name: "select_object", widget: "select", options: [{ label: "Chicago", value: "ORD" },{ label: "Paris", value: "CDG" },{ label: "Tokyo", value: "HND" }]}
          - {label: "Related Post", name: "relation", widget: "relationKitchenSinkPost", collection: "posts", searchFields: ["title", "body"], valueField: "title"}
          - label: "Profile"
            name: "profile"
            widget: "object"
            fields:
              - {label: "Public", name: "public", widget: "boolean", default: true}
              - {label: "Name", name: "name", widget: "string"}
              - label: "Birthdate"
                name: "birthdate"
                widget: "date"
          - label: "List"
            name: "list"
            widget: "list"
            fields:
              - {label: "String", name: "string", widget: "string"}
              - {label: "Boolean", name: "boolean", widget: "boolean"}
              - {label: "Text", name: "text", widget: "text"}
  ```