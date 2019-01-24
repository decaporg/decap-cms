---
label: "Select"
title: select
---

The select widget allows you to pick a string value from a dropdown menu.

- **Name:** `select`
- **UI:** select input
- **Data type:** string or array
- **Options:**
  - `default`: accepts a string; defaults to an empty string
  - `options`: (**required**) a list of options for the dropdown menu; can be listed in two ways:
      - string values: the label displayed in the dropdown is the value saved in the file
      - object with `label` and `value` fields: the label displays in the dropdown; the value is saved in the file
  - `multiple`: accepts a boolean; defaults to `false`
- **Example** (options as strings):
    ```yaml
    - label: "Align Content"
      name: "align"
      widget: "select"
      options: ["left", "center", "right"]
    ```
- **Example** (options as objects):
    ```yaml
    - label: "City"
      name: "airport-code"
      widget: "select"
      options:
        - { label: "Chicago", value: "ORD" }
        - { label: "Paris", value: "CDG" }
        - { label: "Tokyo", value: "HND" }
    ```
- **Example** (multiple):
    ```yaml
    - label: "Tags"
      name: "tags"
      widget: "select"
      multiple: true
      options: ["Design", "UX", "Dev"]
    ```

