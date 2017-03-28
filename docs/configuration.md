# Configuring your site

## Widgets

Widgets define the data type and interface for entry fields. Netlify CMS comes with several built-in widgets, including:

Widget | UI | Data Type
--- | --- | ---
`string` | text input | string
`text` | text area input | plain text, multiline input
`number` | text input with `+` and `-` buttons | number
`markdown` | rich text editor with raw option | markdown-formatted string
`datetime` | date picker widget | ISO date string
`image` | file picker widget with drag-and-drop | file path saved as string, image uploaded to media folder
`hidden` | No UI | Hidden element, typically only useful with a `default` attribute
`list` | text input | strings separated by commas

We’re always adding new widgets, and you can also [create your own](/docs/extending).
