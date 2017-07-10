# Configuring your site

## Widgets

Widgets define the data type and interface for entry fields. Netlify CMS comes with several built-in widgets, including:

| Name       | UI                                | Data Type                                         |
| --------   | --------------------------------- | --------------------------------------------------|
| `string`   | text input                        | string                                            |
| `boolean`  | toggle switch                     | boolean                                           |
| `text`     | textarea input                    | string (multiline)                                |
| `number`   | number input                      | number                                            |
| `markdown` | rich text editor                  | string (markdown)                                 |
| `datetime` | date picker                       | string (ISO date)                                 |
| `select`   | select input (dropdown)           | string                                            |
| `image`    | file picker w/ drag and drop      | image file                                        |
| `file`     | file picker w/ drag and drop      | file                                              |
| `hidden`   | none                              | string                                            |
| `object`   | group of other widgets            | Immutable Map containing field values             |
| `list`     | repeatable group of other widgets | Immutable List of objects containing field values |

We’re always adding new widgets, and you can also [create your own](/docs/extending)!
