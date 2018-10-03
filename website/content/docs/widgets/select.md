---
title: select
label: Select
description: >-
  The select widget allows you to pick a single string value from a dropdown
  menu.
ui: HTML select input
data_type: string
options:
  - description: accepts a string; defaults to an empty string
    name: default
  - description: >-
      (**required**) a list of options for the dropdown menu; can be listed in
      two ways:
        - string values: the label displayed in the dropdown is the value saved in the file
        - object with `label` and `value` fields: the label displays in the dropdown; the value is saved in the file
    name: options
examples:
  - content: |-
      ```yaml
      - label: "Align Content"
        name: "align"
        widget: "select"
        options: ["left", "center", "right"]
      ```
    heading: options as strings
  - content: |
      ```yaml
      - label: "City"
        name: "airport-code"
        widget: "select"
        options:
          - { label: "Chicago", value: "ORD" }
          - { label: "Paris", value: "CDG" }
          - { label: "Tokyo", value: "HND" }
      ```
    heading: options as objects
---

