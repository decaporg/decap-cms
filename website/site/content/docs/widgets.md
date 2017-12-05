---
title: Widgets
position: 30
---

# Widgets

Widgets define the data type and interface for entry fields. Netlify CMS comes with several built-in widgets. Click the widget names in the sidebar to jump to specific widget details. We’re always adding new widgets, and you can also [create your own](/docs/extending)!

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

The Date widget translates a date picker input to a date string. For saving date and time together, use the [DateTime](#datetime) widget.

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

The DateTime widget translates a datetime picker to a datetime string. For saving the date only, use the [Date](#date) widget.

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

The File widget allows editors to upload a file or select an existing one from the media library. The path to the file will be saved to the field as a string.

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

The Image widget allows editors to upload an image or select an existing one from the media library. The path to the image file will be saved to the field as a string.

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

The Number widget uses an HTML number input, saving the value as a string, integer, or floating point number.

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


### Relation Widget

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


### Select Widget

The select widget allows you to pick a string value from a drop down menu

```yaml
collections:
  - name: posts
    label: Post
    folder: "_posts"
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    create: true
    fields:
      - {label: Title, name: title, widget: string, tagname: h1}
      - {label: Body, name: body, widget: markdown}
      - {label: Align Content, name: align, widget: select, options: ['left', 'center', 'right']}
```




