---
label: "List"
target: "list"
type: "widget"
---

### List

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