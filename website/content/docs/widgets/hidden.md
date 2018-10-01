---
label: "Hidden"
title: hidden
---

Hidden widgets do not display in the UI. In folder collections that allow users to create new items, you will often want to set a default for hidden fields, so they will be set without requiring an input.

- **Name:** `hidden`
- **UI:** none
- **Data type:** any valid data type
- **Options:** 
  - `default`: accepts any valid data type; recommended for collections that allow adding new items
- **Example:**
    ```yaml
    - {label: "Layout", name: "layout", widget: "hidden", default: "blog"}
    ```
