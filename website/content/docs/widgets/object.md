---
title: object
label: Object
description: >-

  The object widget allows you to group multiple widgets together, nested under
  a single field. You can choose any widget as a child of an object widget—even
  other objects.
ui: a field containing one or more child widgets
data_type: list of child widget values
options:
  - description: you can set defaults within each sub-field's configuration
    name: default
  - description: (**required**) a nested list of widget fields to include in your widget
    name: fields
examples:
  - content: |
      ```yaml
      - label: "Profile"
        name: "profile"
        widget: "object"
        fields:
          - {label: "Public", name: "public", widget: "boolean", default: true}
          - {label: "Name", name: "name", widget: "string"}
          - label: "Birthdate"
            name: "birthdate"
            widget: "date"
            default: ""
            format: "MM/DD/YYYY"
          - label: "Address"
            name: "address"
            widget: "object"
            fields: 
              - {label: "Street Address", name: "street", widget: "string"}
              - {label: "City", name: "city", widget: "string"}
              - {label: "Postal Code", name: "post-code", widget: "string"}
      ```
---

