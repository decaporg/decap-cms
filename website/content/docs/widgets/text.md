---
label: "Text"
title: text
---

The text widget takes a multiline text field and saves it as a string. For shorter text inputs, use the string widget.

- **Name:** `text`
- **UI:** HTML textarea
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string
- **Example:**
    ```yaml
    - {label: "Description", name: "description", widget: "text"}
    ```
