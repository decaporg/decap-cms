---
label: 'Color'
title: color
---

The color widget and saves it as a string.

- **Name:** `color`
- **UI:** color picker
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string
  - `allowInput`: accepts a boolean, defaults to `false`
  - `enableAlpha`: accepts a boolean, defaults to `false`
- **Example:**
  ```yaml
  - { label: 'Color', name: 'color', widget: 'color' }
  ```
- **Example:**
  ```yaml
  - { label: 'Color', name: 'color', widget: 'color', enableAlpha: true, allowInput: true }
  ```
