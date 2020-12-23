---
label: "String"
title: string
---

The string widget translates a basic text input to a string value. For larger textarea inputs, use the text widget.

- **Name:** `string`
- **UI:** text input
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string
    - `trim`: accepts a boolean, defaults to `false`. Trims whitespace from the beginning and the end of the input string
- **Example:**
    ```yaml
    - {label: "Title", name: "title", widget: "string"}
    ```
- **With trim:**
    ```yaml
    - {label: "Title", name: "title", widget: "string", trim: true}
    ```
