---
title: boolean
label: "Boolean"
description: The boolean widget translates a toggle switch input to a true/false value.
ui: toggle switch
data_type: boolean
options:
  - {name: default, description: accepts `true` or `false`; defaults to `false`}
examples:
  - heading: test
    content: |
      ```yaml
      - {label: "Draft", name: "draft", widget: "boolean", default: true}
      ```
---
