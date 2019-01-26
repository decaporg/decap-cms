---
title: Creating Custom Entry Card
weight: 25
group: guides
---

The NetlifyCMS exposes a `window.CMS` global object that you can use to register custom widgets, previews, and editor plugins. The same object is also the default export if you import Netify CMS as an npm module. The available entry card extension methods are:

* **registerEntryCard:** registers a custom card, for a collection.
* **getEntryCard:** get a custom entry card by it's collection name.

### Writing React Components inline

The `registerEntryCard` requires you to provide a React component. If you have a build process in place for your project, it is possible to integrate with this build process.

However, although possible, it may be cumbersome or even impractical to add a React build phase. For this reason, NetlifyCMS exposes two constructs globally to allow you to create components inline: ‘createClass’ and ‘h’ (alias for React.createElement).

## `registerEntryCard`

Register a custom widget.

```js
// Using global window object
CMS.registerEntryCard(collectionName, component);

// Using npm module import
import CMS from 'netlify-cms';
CMS.registerEntryCard(collectionName, component);
```

**Params:**

| Param            | Type                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collectionName` | `String`                                      | the collection name (set in config.yml) for which this card will be rendered.                                                                                                                                                                                                                                                                                                                                                                                        |
| `component`      | `React.Component` or `"functional component"` | React component that renders the entry card, receives the following props: <ul><li>**collection**: &lt;`Immutable.Map`&gt; contains the config set for this collection (in config.yml)</li><li>**entry**: &lt;`Immutable.Map`&gt; contains the entry data (frontmatter and body, when markdown)</li><li>**publicFolder**: &lt;`String`&gt; the publicFolder set in config.yml</li><li>**viewStyle**: &lt;`Enum`&gt; `VIEW_STYLE_LIST` OR `VIEW_STYLE_GRID`</li></ul> |


**Example:**

```html
<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
<script>
  function formatDate(date) {
    if(date && date.toLocaleDateString) return date.toLocaleDateString('en');
    return date.toString ? date.toString() : '';
  }
  function PostEntryCard({entry, collection}) {
    const title = entry.getIn(['data', 'title']);
    const date = entry.getIn(['data', 'date']);
    const path = `#/collections/${collection.get('name')}/entries/${entry.get('slug')}`;
    return (
      h('div', {style: {flex: 1, minWidth: '100%'}},
        h('a', {href: path}, [
          h('h2', {key: 'title'}, title),
          h('h3', {key: 'date'}, formatDate(date)),
        ])
      )
    );
  }

  CMS.registerEntryCard('posts', PostEntryCard);
</script>
```
