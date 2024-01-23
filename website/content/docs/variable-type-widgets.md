---
label: "Variable Type Widgets"
group: Fields
weight: 30
---

Before this feature, the [list widget](/docs/widgets/#list) allowed a set of fields to be repeated, but every list item had the same set of fields available. With variable types, multiple named sets of fields can be defined, which opens the door to highly flexible content authoring (even page building) in Decap CMS.

**Note: this feature does not yet support default previews and requires [registering a preview template](/docs/customization#registerpreviewtemplate) in order to show up in the preview pane.**

To use variable types in the list widget, update your field configuration as follows:

1. Instead of defining your list fields under `fields` or `field`, define them under `types`. Similar to `fields`, `types` must be an array of field definition objects.
2. Each field definition under `types` must use the `object` widget (this is the default value for
   `widget`).

### Additional list widget options

* `types`: a nested list of object widgets. All widgets must be of type `object`. Every object widget may define different set of fields.
* `typeKey`: the name of the field that will be added to every item in list representing the name of the object widget that item belongs to. Ignored if `types` is not defined. Default is `type`.
* `summary`: allows customization of a collapsed list item object in a similar way to a [collection summary](/docs/configuration-options/?#summary)

### Example Configuration

The example configuration below imagines a scenario where the editor can add two "types" of content,
either a "carousel" or a "spotlight". Each type has a unique name and set of fields.

```yaml
- label: 'Home Section'
  name: 'sections'
  widget: 'list'
  types:
    - label: 'Carousel'
      name: 'carousel'
      widget: object
      summary: '{{fields.header}}'
      fields:
        - { label: Header, name: header, widget: string, default: 'Image Gallery' }
        - { label: Template, name: template, widget: string, default: 'carousel.html' }
        - label: Images
          name: images
          widget: list
          field: { label: Image, name: image, widget: image }
    - label: 'Spotlight'
      name: 'spotlight'
      widget: object
      fields:
        - { label: Header, name: header, widget: string, default: 'Spotlight' }
        - { label: Template, name: template, widget: string, default: 'spotlight.html' }
        - { label: Text, name: text, widget: text, default: 'Hello World' }
```

### Example Output

The output for the list widget will be an array of objects, and each object will have a `type` key
with the name of the type used for the list item. The `type` key name can be customized via the
`typeKey` property in the list configuration.

If the above example configuration were used to create a carousel, a spotlight, and another
carousel, the output could look like this:

```yaml
title: Home
sections:
  - type: carousel
    header: Image Gallery
    template: carousel.html
    images:
      - images/image01.png
      - images/image02.png
      - images/image03.png
  - type: spotlight
    header: Spotlight
    template: spotlight.html
    text: Hello World
  - type: carousel
    header: Image Gallery
    template: carousel.html
    images:
      - images/image04.png
      - images/image05.png
      - images/image06.png
```
