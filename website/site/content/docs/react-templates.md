---
title: React Preview Templates
weight: 60
menu:
  docs:
    parent: guides
---

# React Preview Templates

React is the default "template language" for previews. Each preview template is a component that
accepts the entry and other data as `props`. For React based static site generators, like Gatsby and
React Static, production site template components can often be reused as Netlify CMS preview
components.

**Unfamiliar with React?** You may want to [brush
up](https://reactjs.org/docs/hello-world.html) on it before proceeding.

**No build system?** If you want to write [JSX](#) as we do in the examples below, but are not using a
build system, check out the [JSX in the browser](#) guide for tips.


## Props

The following props are available to React preview template components:

### `props.entry`

#### `props.entry.fields`

An object containing all configured fields for the current entry, including nested
fields. Each field object will contain up to three properties:

**`value`:** the raw field value\
**`preview`:** _(optional)_ the HTML field preview\
**`data`:** _(optional)_ secondary field data\

```js
const PostPreview = (props) => {
  const fields = props.entry.fields;
  return (
    <div>
      <img src={fields.cover.data.src}/>
      <h1>{fields.title.value}</h1>
      <div>{fields.author.name.value}</div>
      <div>{fields.date.value}</div>
      <div>{fields.body.preview}</div>
    </div>
  )
}
```

### `props.entry.collection`

The name of the collection containing the current entry.

### `props.collections`

`props.collections` is an object containing all collections and their entries. The entry objects
contain the same `fields` property as documented under [`props.fields`](#).

```js
const PostPreview = (props) => {
  const fields = props.entry.fields;
  const collections = props.collections;
  return (
    <div>
      <h1>{fields.title.value}</h1>
      <div>{collections.authors.fields}
      <div>{fields.author.name.value}</div>
      <div>{fields.date.value}</div>
      <div>{fields.body.preview}</div>
    </div>
  )
}
```
