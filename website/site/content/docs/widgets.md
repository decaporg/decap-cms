---
title: Widgets
position: 30
---

# Widgets

Widgets define the data type and interface for entry fields. Netlify CMS comes with several built-in widgets. Click the widget names in the sidebar to jump to specific widget details. We’re always adding new widgets, and you can also [create your own](https://www.netlifycms.org/docs/custom-widgets)!

Widgets are specified as collection fields in the `config.yml` file. Note that [YAML syntax](https://en.wikipedia.org/wiki/YAML#Basic_components) allows lists and objects to be written in block or inline style, and the code samples below include a mix of both.

To see working examples of all of the built-in widgets, try making a 'Kitchen Sink' collection item on the [CMS demo site](https://cms-demo.netlify.com). (No login required: click the login button and the CMS will open.) You can refer to the demo [configuration code](https://github.com/netlify/netlify-cms/blob/master/example/config.yml#L60) to see how each field was configured.


## Common widget options

The following options are available on all fields:

- `required`: specify as `false` to make a field optional; defaults to `true`
- `pattern`: add field validation by specifying a list with a regex pattern and an error message; more extensive validation can be achieved with [custom widgets](https://www.netlifycms.org/docs/custom-widgets/#advanced-field-validation)
  - **Example:**

    ```yaml
    - label: "Title"
      name: "title"
      widget: "string"
      pattern: ['.{10,}', "Must have at least 20 characters"]
    ```

 
## Boolean

The boolean widget translates a toggle switch input to a true/false value.

- **Name:** `boolean`
- **UI:** toggle switch
- **Data type:** boolean
- **Options:**
  - `default`: accepts `true` or `false`; defaults to `false`
- **Example:**

  ```yaml
  - {label: "Draft", name: "draft", widget: "boolean", default: true}
  ```


## Date

The date widget translates a date picker input to a date string. For saving date and time together, use the [DateTime](#datetime) widget.

- **Name:** `date`
- **UI:** date picker
- **Data type:** Moment.js-formatted date string
- **Options:**
  - `default`: accepts a date string, or an empty string to accept blank input; otherwise defaults to current date
  - `format`: accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to ISO8601 format `YYYY-MM-DD`
- **Example:**

  ```yaml
  - label: "Birthdate"
    name: "birthdate"
    widget: "date"
    default: ""
    format: "MMM Do YY"
  ```


## DateTime

The datetime widget translates a datetime picker to a datetime string. For saving the date only, use the [Date](#date) widget.

- **Name:** `datetime`
- **UI:** datetime picker
- **Data type:** Moment.js-formatted datetime string
- **Options:**
  - `default`: accepts a datetime string, or an empty string to accept blank input; otherwise defaults to current datetime
  - `format`: accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to ISO8601 format `YYYY-MM-DDTHH:mm:ssZ`
- **Example:**

  ```yaml
  - label: "Start time"
    name: "start"
    widget: "datetime"
    default: ""
    format: "LLL"
  ```


## File

The file widget allows editors to upload a file or select an existing one from the media library. The path to the file will be saved to the field as a string.

- **Name:** `file`
- **UI:** file picker button opens media gallery
- **Data type:** file path string, based on `media_folder`/`public_folder` configuration
- **Options:**
  - `default`: accepts a file path string; defaults to null
- **Example:**

  ```yaml
  - label: "Manual PDF"
    name: "manual_pdf"
    widget: "file"
    default: "/uploads/general-manual.pdf"
  ```


## Hidden

Hidden widgets do not display in the UI. In folder collections that allow users to create new items, you will often want to set a default for hidden fields, so they will be set without requiring an input.

- **Name:** `hidden`
- **UI:** none
- **Data type:** any valid data type
- **Options:** 
  - `default`: accepts any valid data type; recommended for collections that allow adding new items
- **Example:**

  ```yaml
  - {label: "Layout", name: "layout", widget: "hidden", default: "blog"}
  ```


## Image

The image widget allows editors to upload an image or select an existing one from the media library. The path to the image file will be saved to the field as a string.

- **Name:** `image`
- **UI:** file picker button opens media gallery allowing image files (jpg, jpeg, webp, gif, png, bmp, tiff, svg) only; displays selected image thumbnail
- **Data type:** file path string, based on `media_folder`/`public_folder` configuration
- **Options:**
  - `default`: accepts a file path string; defaults to null
- **Example:**

  ```yaml
  - label: "Featured Image"
    name: "thumbnail"
    widget: "image"
    default: "/uploads/chocolate-dogecoin.jpg"
  ```


## List

The list widget allows you to create a repeatable item in the UI which saves as a list of widget values. map a user-provided string with a comma delimiter into a list. You can choose any widget as a child of a list widget—even other lists.

- **Name:** `list`
- **UI:** if `fields` is specified, field containing a repeatable child widget, with controls for adding, deleting, and re-ordering the repeated widgets; if unspecified, a text input for entering comma-separated values
- **Data type:** list of widget values
- **Options:**
  - `default`: if `fields` is specified, declare defaults on the child widgets; if not, you may specify a list of strings to populate the text field
  - `field`: a single widget field to be repeated
  - `fields`: a nested list of multiple widget fields to be included in each repeatable iteration
- **Example** (`field`/`fields` not specified):

  ```yaml
  - label: "Tags"
    name: "tags"
    widget: "list"
    default: ["news"]
  ```

- **Example** (with `field`):

  ```yaml
  - label: "Gallery"
    name: "galleryImages"
    widget: "list"
    field:
      - {label: Image, name: image, widget: image}
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


## Number

The number widget uses an HTML number input, saving the value as a string, integer, or floating point number.

- **Name:** `number`
- **UI:** HTML [number input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
- **Data type:** string by default; configured by `valueType` option
- **Options:**
  - `default`: accepts string or number value; defaults to empty string
  - `valueType`: accepts `int` or `float`; any other value results in saving as a string
  - `min`: accepts a number for minimum value accepted; unset by default
  - `max`: accepts a number for maximum value accepted; unset by default
- **Example:**

  ```yaml
  - label: "Puppy Count"
    name: "puppies"
    widget: "number"
    default: 2
    valueType: "int"
    min: 1
    max: 101
  ```


## Object

The object widget allows you to group multiple widgets together, nested under a single field. You can choose any widget as a child of an object widget—even other objects.

- **Name:** `object`
- **UI:** a field containing one or more child widgets
- **Data type:** list of child widget values
- **Options:**
  - `default`: you can set defaults within each sub-field's configuration
  - `fields`: (**required**) a nested list of widget fields to include in your widget
- **Example:**

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


## Relation

The relation widget allows you to reference items from another collection. It provides a search input with a list of entries from the collection you're referencing, and the list automatically updates with matched entries based on what you've typed.

- **Name:** `relation`
- **UI:** text input with search result dropdown
- **Data type:** data type of the value pulled from the related collection item
- **Options:**
  - `default`: accepts any widget data type; defaults to an empty string
  - `collection`: (**required**) name of the collection being referenced (string)
  - `searchFields`: (**required**) list of one or more names of fields in the referenced collection to search for the typed value
  - `valueField`: (**required**) name of the field from the referenced collection whose value will be stored for the relation
- **Example** (assuming a separate "authors" collection with "name" and "twitterHandle" fields):

  ```yaml
  - label: Post Author
    name: author
    widget: relation
    collection: authors
    searchFields: [name, twitterHandle]
    valueField: name
  ```
  The generated UI input will search the authors collection by name and twitterHandle as the user types. On selection, the author name will be saved for the field.


## Select

The select widget allows you to pick a single string value from a dropdown menu.

- **Name:** `select`
- **UI:** HTML select input
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string
  - `options`: (**required**) a list of options for the dropdown menu; can be listed in two ways:
      - string values: the label displayed in the dropdown is the value saved in the file
      - object with `label` and `value` fields: the label displays in the dropdown; the value is saved in the file
- **Example** (options as strings):

  ```yaml
  - label: "Align Content"
    name: "align"
    widget: "select"
    options: ["left", "center", "right"]
  ```
- **Example** (options as objects):

  ```yaml
  - label: "City"
    name: "airport-code"
    widget: "select"
    options:
      - { label: "Chicago", value: "ORD" }
      - { label: "Paris", value: "CDG" }
      - { label: "Tokyo", value: "HND" }
  ```


## String

The string widget translates a basic text input to a string value. For larger textarea inputs, use the [text](#text) widget.

- **Name:** `string`
- **UI:** text input
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string
- **Example:**

  ```yaml
  - {label: "Title", name: "title", widget: "string"}
  ```


## Text

The text widget takes a multiline text field and saves it as a string. For shorter text inputs, use the [string](#string) widget.

- **Name:** `text`
- **UI:** HTML textarea
- **Data type:** string
- **Options:**
  - `default`: accepts a string; defaults to an empty string
- **Example:**

  ```yaml
  - {label: "Description", name: "description", widget: "text"}
  ```
