---
title: Widgets
weight: 30
menu:
  docs:
    parent: reference
---

# Widgets

Widgets define the data type and interface for entry fields. Netlify CMS comes with several built-in widgets. Click the widget names in the sidebar to jump to specific widget details. We’re always adding new widgets, and you can also [create your own](https://www.netlifycms.org/docs/custom-widgets)!

Widgets are specified as collection fields in the Netlify CMS `config.yml` file. Note that [YAML syntax](https://en.wikipedia.org/wiki/YAML#Basic_components) allows lists and objects to be written in block or inline style, and the code samples below include a mix of both.

To see working examples of all of the built-in widgets, try making a 'Kitchen Sink' collection item on the [CMS demo site](https://cms-demo.netlify.com). (No login required: click the login button and the CMS will open.) You can refer to the demo [configuration code](https://github.com/netlify/netlify-cms/blob/master/example/config.yml#L60) to see how each field was configured.


## Common widget options

The following options are available on all fields:

- `required`: specify as `false` to make a field optional; defaults to `true`
- `pattern`: add field validation by specifying a list with a [regex pattern](https://regexr.com/) and an error message; more extensive validation can be achieved with [custom widgets](https://www.netlifycms.org/docs/custom-widgets/#advanced-field-validation)
  - **Example:**

    ```yaml
    - label: "Title"
      name: "title"
      widget: "string"
      pattern: [".{12,}", "Must have at least 12 characters"]
    ```

## Default widgets
