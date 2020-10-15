---
title: object
label: Object
---
The object widget allows you to group multiple widgets together, nested under a single field. You can choose any widget as a child of an object widget—even other objects.

* **Name:** `object`
* **UI:** a field containing one or more child widgets
* **Data type:** list of child widget values
* **Options:**

  * `default`: you can set defaults within each sub-field's configuration
  * `collapsed`: if added and labeled `true`, collapse the widget's content by default
  * `summary`: specify the label displayed when the object is collapsed
  * `fields`: (**required**) a nested list of widget fields to include in your widget
* **Example:**

  ```yaml
  - label: "Profile"
    name: "profile"
    widget: "object"
    summary: '{{fields.name}}: {{fields.birthdate}}'
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
        collapsed: true
        fields: 
          - {label: "Street Address", name: "street", widget: "string"}
          - {label: "City", name: "city", widget: "string"}
          - {label: "Postal Code", name: "post-code", widget: "string"}
  ```
