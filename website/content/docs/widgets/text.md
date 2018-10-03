---
title: text
label: Text
description: >-
  The text widget takes a multiline text field and saves it as a string. For
  shorter text inputs, use the string widget.
ui: HTML textarea
data_type: string
options:
  - description: accepts a string; defaults to an empty string
    name: default
examples:
  - content: |-
      ```yaml
      - {label: "Description", name: "description", widget: "text"}
      ```
---

