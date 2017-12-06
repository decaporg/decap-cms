---
title: Widgets
position: 30
---

# Widgets

Widgets define the data type and interface for entry fields. Netlify CMS comes with several built-in widgets. Click the widget names in the sidebar to jump to specific widget details. We’re always adding new widgets, and you can also [create your own](/docs/extending)!

To see working examples of all of the built-in widgets, try making a 'Kitchen Sink' collection item on the [CMS demo site](https://cms-demo.netlify.com). (No login required: click the login button and the CMS will open.) You can refer to the demo [configuration code](https://github.com/netlify/netlify-cms/blob/master/example/config.yml#L60) to see how each field was configured.

| Name       | UI                                 | Data Type                                          |
| --------   | ---------------------------------- | ---------------------------------------------------|
| `string`   | text input                         | string                                             |
| `boolean`  | toggle switch                      | boolean                                            |
| `text`     | textarea input                     | string (multiline)                                 |
| `number`   | number input                       | number                                             |
| `markdown` | rich text editor                   | string (markdown)                                  |
| `datetime` | date picker                        | string (ISO date)                                  |
| `select`   | select input (dropdown)            | string                                             |
| `image`    | file picker w/ drag-and-drop       | image file                                         |
| `file`     | file picker w/ drag-and-drop       | file                                               |
| `hidden`   | none                               | string                                             |
| `object`   | group of other widgets             | Immutable Map containing field values              |
| `list`     | repeatable group of other widgets  | Immutable List of objects containing field values  |
| `relation` | text input w/ suggestions dropdown | value of `valueField` in related entry (see below) |

 
## Boolean

The boolean widget translates a toggle switch input to a true/false value.

- Name: `boolean`
- UI: toggle switch
- Data type: boolean
- Options:
  - `default`: accepts `true` or `false`; defaults to `false`
- Example:

  ```yaml
  - {label: "Draft", name: "draft", widget: "boolean", default: true}
  ```


## Date

The date widget translates a date picker input to a date string. For saving date and time together, use the [DateTime](#datetime) widget.

- Name: `date`
- UI: date picker
- Data type: Moment.js-formatted date string
- Options:
  - `default`: accepts a date string, or an empty string to accept blank input; otherwise defaults to current date
  - `format`: accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to ISO8601 format `YYYY-MM-DD`
- Example:

  ```yaml
  - label: "Birthdate"
    name: "birthdate"
    widget: "date"
    default: ""
    format: "MMM Do YY"
  ```


## DateTime

The datetime widget translates a datetime picker to a datetime string. For saving the date only, use the [Date](#date) widget.

- Name: `datetime`
- UI: datetime picker
- Data type: Moment.js-formatted datetime string
- Options:
  - `default`: accepts a datetime string, or an empty string to accept blank input; otherwise defaults to current datetime
  - `format`: accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to ISO8601 format `YYYY-MM-DDTHH:mm:ssZ`
- Example:

  ```yaml
  - label: "Start time"
    name: "start"
    widget: "datetime"
    default: ""
    format: "LLL"
  ```


## File

The file widget allows editors to upload a file or select an existing one from the media library. The path to the file will be saved to the field as a string.

- Name: `file`
- UI: file picker button opens media gallery
- Data type: file path string, based on `media_folder`/`public_folder` configuration
- Options:
  - `default`: accepts a file path string; defaults to null
- Example:

  ```yaml
  - label: "Manual PDF"
    name: "manual_pdf"
    widget: "file"
    default: "/uploads/general-manual.pdf"
  ```


## Image

The image widget allows editors to upload an image or select an existing one from the media library. The path to the image file will be saved to the field as a string.

- Name: `image`
- UI: file picker button opens media gallery allowing image files (jpg, jpeg, webp, gif, png, bmp, tiff, svg) only; displays selected image thumbnail
- Data type: file path string, based on `media_folder`/`public_folder` configuration
- Options:
  - `default`: accepts a file path string; defaults to null
- Example:

  ```yaml
  - label: "Featured Image"
    name: "thumbnail"
    widget: "image"
    default: "/uploads/chocolate-dogecoin.jpg"
  ```


## List [WIP]

The list widget allows you to create a repeatable item in the UI which saves as a comma-delimited list of items. map a user-provided string with a comma delimiter into a list. Consider the following example that also demonstrates how to set default values:

```yaml
  - {label: Tags, name: tags, widget: list, default: ['term_1', 'term_2']}
```

Lists of objects are supported as well and require a nested field list.

```yaml
- label: Authors
  name: authors
  widget: list
  fields:
    - {label: Name, name: name, widget: string}
    - {label: Description, name: description, widget: markdown}
```


## Number

The number widget uses an HTML number input, saving the value as a string, integer, or floating point number.

- Name: `number`
- UI: HTML [number input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
- Data type: string by default; configured by `valueType` option
- Options:
  - `default`: accepts string or number value; defaults to empty string
  - `valueType`: accepts `int` or `float`; any other value results in saving as a string
  - `min`: accepts a number for minimum value accepted; unset by default
  - `max`: accepts a number for maximum value accepted; unset by default
- Example:

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

- Name: `object`
- UI: a field containing other fields
- Data type: immutable map containing the sub-field values
- Options:
  - `default`: you can set defaults within each sub-field's configuration
  - `fields`: (**required**) a nested list of fields to include in your widget
- Example:

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


## Relation [WIP]

The relation widget allows you to reference an existing entry from within the entry you're editing. It provides a search input with a list of entries from the collection you're referencing, and the list automatically updates with matched entries based on what you've typed.

The following field configuration properties are specific to fields using the relation widget:

Property | Accepted Values | Description
--- | --- | ---
`collection` | string | name of the collection being referenced
`searchFields` | list | one or more names of fields in the referenced colleciton to search for the typed value
`valueField` | string | name a field from the referenced collection whose value will be stored for the relation
`name` | text input | string

Let's say we have a "posts" collection and an "authors" collection, and we want to select an author for each post - our config might look something like this:

```yaml
collections:
  - name: authors
    label: Authors
    folder: "authors"
    create: true
    fields:
      - {name: name, label: Name}
      - {name: twitterHandle, label: "Twitter Handle"}
      - {name: bio, label: Bio, widget: text}
  - name: posts
    label: Posts
    folder: "posts"
    create: true
    fields:
      - {name: title, label: Title}
      - {name: body, label: Body, widget: markdown}
      - name: author
        label: Author
        widget: relation
        collection: authors
        searchFields: [name, twitterHandle]
        valueField: name
```


## Select

The select widget allows you to pick a single string value from a dropdown menu.

- Name: `select`
- UI: HTML select input
- Data type: string
- Options:
  - `default`: accepts a string; defaults to an empty string
  - `options`: (**required**) an array or list of options for the dropdown menu; can be listed in two ways:
    - string values: the label displayed in the dropdown is the value saved in the file
    - object with `label` and `value` fields: the label displays in the dropdown; the value is saved in the file
- Example (options as strings):
  ```yaml
  - label: "Align Content"
    name: "align"
    widget: "select"
    options: ["left", "center", "right"]
  ```
- Example (options as objects):
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

- Name: `string`
- UI: text input
- Data type: string
- Options:
  - `default`: accepts a string; defaults to an empty string
- Example:

  ```yaml
  - {label: "Title", name: "title", widget: "string"}
  ```


## Text

The text widget takes a multiline text field and saves it as a string. For shorter text inputs, use the [string](#string) widget.

- Name: `text`
- UI: HTML textarea
- Data type: string
- Options:
  - `default`: accepts a string; defaults to an empty string
- Example:

  ```yaml
  - {label: "Description", name: "description", widget: "text"}
  ```