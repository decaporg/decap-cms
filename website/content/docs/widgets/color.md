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
  - `editable`: accepts a boolean, defaults to `false`
  - `disableAlpha`: accepts a boolean, defaults to `false`
- **Example:**
  ```yaml
  - { label: 'Color', name: 'color', widget: 'color' }
  ```
- **Example:**
  ```yaml
  - { label: 'Color', name: 'color', widget: 'color', disableAlpha: true, editable: true }
  ```
