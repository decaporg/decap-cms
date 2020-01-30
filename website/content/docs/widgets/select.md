---
label: "Select"
title: select
---

The select widget allows you to pick a string value from a dropdown menu.

- **Name:** `select`
- **UI:** select input
- **Data type:** string or array
- **Options:**
  - `default`: default values must be contained in `options` and are ignored otherwise
      - string values: accepts a string; defaults to an empty string. Accepts an array of strings and defaults to an empty array  with `multiple: true` enabled.
      - object with `label` and `value` fields: accepts an object with `label` and `value` field or an array of such objects when `multiple: true` is enable. Defaults to no value
  - `options`: (**required**) a list of options for the dropdown menu; can be listed in two ways:
      - string values: the label displayed in the dropdown is the value saved in the file
      - object with `label` and `value` fields: the label displays in the dropdown; the value is saved in the file
  - `multiple`: accepts a boolean; defaults to `false`
  - `min`: minimum number of items; ignored if **multiple** is not `true`
  - `max`: maximum number of items; ignored if **multiple** is not `true`
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
      default: ["Design"]
    ```
- **Example** (min/max):
    ```yaml
    - label: "Tags"
      name: "tags"
      widget: "select"
      multiple: true
      min: 1
      max: 3
      options: ["Design", "UX", "Dev"]
      default: ["Design"]
    ```
