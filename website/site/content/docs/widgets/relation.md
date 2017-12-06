---
label: "Relation"
target: "relation"
type: "widget"
---

### Relation

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
