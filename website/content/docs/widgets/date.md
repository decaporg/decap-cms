---
title: date
label: Date
description: >-
  The date widget translates a date picker input to a date string. For saving
  date and time together, use the datetime widget.
ui: date picker
data_type: Moment.js-formatted date string
options:
  - description: >-
      accepts a date string, or an empty string to accept blank input; otherwise
      defaults to current date
    name: default
  - description: >-
      optional; accepts Moment.js
      [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to
      raw Date object (if supported by output format)
    name: format
examples:
  - content: |-
      ```yaml
      - label: "Birthdate"
        name: "birthdate"
        widget: "date"
        default: ""
        format: "MMM Do YY"
      ```
---

