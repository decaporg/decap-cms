---
title: hidden
label: Hidden
description: >-
  Hidden widgets do not display in the UI. In folder collections that allow
  users to create new items, you will often want to set a default for hidden
  fields, so they will be set without requiring an input.
ui: none
data_type: any valid data type
options:
  - description: >-
      accepts any valid data type; recommended for collections that allow adding
      new items
    name: default
examples:
  - content: |-
      ```yaml
      - {label: "Layout", name: "layout", widget: "hidden", default: "blog"}
      ```
---

