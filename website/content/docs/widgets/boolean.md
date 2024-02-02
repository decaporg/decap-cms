---
title: boolean
label: "Boolean"
---

The boolean widget translates a toggle switch input to a true/false value.

- **Name:** `boolean`
- **UI:** toggle switch
- **Data type:** boolean
- **Options:**
  - `default`: accepts `true` or `false`; defaults to `false` when `required` is set to `false`
  - `prefix`: display a message before the toggle; accepts a string; defaults to an empty string
  - `suffix`: display a message after the toggle; accepts a string; defaults to an empty string
- **Example:**
    ```yaml
    - label: "Draft"
      name: "draft"
      widget: "boolean"
      prefix: "OFF"
      default: true
      suffix: "ON"
    ```
