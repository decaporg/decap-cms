---
label: 'Color'
title: color
---

The color widget translates a color picker to a color string.

- **Name:** `color`
- **UI:** color picker
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string. Sets the default value
  - `allowInput`: accepts a boolean, defaults to `false`. Allows manual editing of the color input value
  - `enableAlpha`: accepts a boolean, defaults to `false`. Enables Alpha editing
- **Example:**
  ```yaml
  - { label: 'Color', name: 'color', widget: 'color' }
  ```
- **Example:**
  ```yaml
  - { label: 'Color', name: 'color', widget: 'color', enableAlpha: true, allowInput: true }
  ```
