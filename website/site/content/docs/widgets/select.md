---
label: "Select"
target: "select"
---

### Select

The select widget allows you to pick a single string value from a dropdown menu.

- **Name:** `select`
- **UI:** HTML select input
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string
  - `options`: (**required**) a list of options for the dropdown menu; can be listed in two ways:
      - string values: the label displayed in the dropdown is the value saved in the file
      - object with `label` and `value` fields: the label displays in the dropdown; the value is saved in the file
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

