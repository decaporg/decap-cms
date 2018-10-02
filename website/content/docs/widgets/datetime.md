---
title: datetime
label: DateTime
description: >-
  The datetime widget translates a datetime picker to a datetime string. For
  saving the date only, use the date widget.
ui: datetime picker
data_type: Moment.js-formatted datetime string
options:
  - description: >-
      accepts a datetime string, or an empty string to accept blank input;
      otherwise defaults to current datetime
    name: default
  - description: >-
      optional; accepts Moment.js
      [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to
      raw Date object (if supported by output format)
    name: format
examples:
  - content: |
      ```yaml
      - label: "Start time"
        name: "start"
        widget: "datetime"
        default: ""
        format: "LLL"
      ```
---


- **Name:** `datetime`
- **UI:** datetime picker
- **Data type:** Moment.js-formatted datetime string
- **Options:**
  - `default`: accepts a datetime string, or an empty string to accept blank input; otherwise defaults to current datetime
  - `format`: optional; accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to raw Date object (if supported by output format)
- **Example:**
    ```yaml
    - label: "Start time"
      name: "start"
      widget: "datetime"
      default: ""
      format: "LLL"
    ```
