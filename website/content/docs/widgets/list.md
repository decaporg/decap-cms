---
label: "List"
title: list
---

The list widget allows you to create a repeatable item in the UI which saves as a list of widget values. map a user-provided string with a comma delimiter into a list. You can choose any widget as a child of a list widget—even other lists. Or you can define a list with different widgets to create list of different item types.

- **Name:** `list`
- **UI:** if `fields` is specified, field containing a repeatable child widget, with controls for adding, deleting, and re-ordering the repeated widgets; if unspecified, a text input for entering comma-separated values. If `widgets` is specified instead, the list will render items of different widget types. 
- **Data type:** list of widget values
- **Options:**
  - `default`: if `fields` is specified, declare defaults on the child widgets; if not, you may specify a list of strings to populate the text field
  - `allow_add`: if added and labeled `false`, button to add additional widgets disappears. When user together with `widgets`, additional control for selecting a widget type will be available.
  - `field`: a single widget field to be repeated
  - `fields`: a nested list of multiple widget fields to be included in each repeatable iteration
  - `widgets`: a nested list of widgets. Each widget will define different item type that could be added to the list.
- **Example** (`field`/`fields` not specified):
    ```yaml
    - label: "Tags"
      name: "tags"
      widget: "list"
      default: ["news"]
    ```
- **Example** (`allow_add` marked `false`):
    ```yaml
    - label: "Tags"
      name: "tags"
      widget: "list"
      allow_add: false
      default: ["news"]
    ```
- **Example** (with `field`):
    ```yaml
    - label: "Gallery"
      name: "galleryImages"
      widget: "list"
      field: {label: Image, name: image, widget: image}
    ```
- **Example** (with `fields`):
    ```yaml
    - label: "Testimonials"
      name: "testimonials"
      widget: "list"
      fields:
        - {label: Quote, name: quote, widget: string, default: "Everything is awesome!"}
        - label: Author
          name: author
          widget: object
          fields:
            - {label: Name, name: name, widget: string, default: "Emmet"}
            - {label: Avatar, name: avatar, widget: image, default: "/img/emmet.jpg"}
    ```
- **Example** (with `widgets`):
    ```yaml
    - label: "Home Section"
      name: "sections"
      widget: "list"
      widgets:
        - label: "Carousel"
          name: "carousel"
          widget: object
          fields:
            - {label: Header, name: header, widget: string, default: "Image Gallery"}
            - {label: Template, name: template, widget: string, default: "carousel.html"}
            - label: Images
              name: images
              widget: list
              field: {label: Image, name: image, widget: image}
        - label: "Spotlight"
          name: "spotlight"
          widget: object
          fields:
            - {label: Header, name: header, widget: string, default: "Spotlight"}
            - {label: Template, name: template, widget: string, default: "spotlight.html"}
            - {label: Text, name: text, widget: text, default: "Hello World"}
    ```
    Above list widget may be used to create following frontmatter with two carousel and one spotlight sections:
    ```yaml
    title: Home
    sections:
      - widget: carousel
        header: Image Gallery
        template: carousel.html
        images:
          - images/image01.png
          - images/image02.png
          - images/image03.png
      - widget: spotlight
        header: Spotlight
        template: spotlight.html
        text: Hello World
      - widget: carousel
        header: Image Gallery
        template: carousel.html
        images:
          - images/image04.png
          - images/image05.png
          - images/image06.png
    ```
    The `widget` field must be present on each section object and will be added automatically when new section is created through CMS.
