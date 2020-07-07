---
title: Creating Custom Widgets
weight: 35
group: fields
---

The NetlifyCMS exposes a `window.CMS` global object that you can use to register custom widgets, previews, and editor plugins. The same object is also the default export if you import Netify CMS as an npm module. The available widget extension methods are:

* **registerWidget:** registers a custom widget.
* **registerEditorComponent:** adds a block component to the Markdown editor.

See also [netlify-cms-widget-starter](https://github.com/netlify/netlify-cms-widget-starter) for a starter project to fork.

### Writing React Components inline

The `registerWidget` requires you to provide a React component. If you have a build process in place for your project, it is possible to integrate with this build process.

However, although possible, it may be cumbersome or even impractical to add a React build phase. For this reason, NetlifyCMS exposes two constructs globally to allow you to create components inline: ‘createClass’ and ‘h’ (alias for React.createElement).

## `registerWidget`

Register a custom widget.

```js
// Using global window object
CMS.registerWidget(name, control, [preview], [schema]);

// Using npm module import
import CMS from 'netlify-cms';
CMS.registerWidget(name, control, [preview], [schema]);
```

**Params:**

| Param       | Type                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`      | `string`                    | Widget name, allows this widget to be used via the field `widget` property in config                                                                                                                                                                                                                                                                                                                                                                                        |
| `control`   | `React.Component` or `string`| <ul><li>React component that renders the control, receives the following props: <ul><li>**value:** Current field value</li><li>**field:** Immutable map of current field configuration</li><li>**forID:** Unique identifier for the field</li><li>**classNameWrapper:** class name to apply CMS styling to the field</li><li>**onChange:** Callback function to update the field value</li></ul></li><li>Name of a registered widget whose control should be used (includes built in widgets).</li></ul>                                                                                                                                                                  |
| [`preview`] | `React.Component`, optional | Renders the widget preview, receives the following props: <ul><li>**value:** Current preview value</li><li>**field:** Immutable map of current field configuration</li><li>**metadata:** Immutable map of any available metadata for the current field</li><li>**getAsset:** Function for retrieving an asset url for image/file fields</li><li>**entry:** Immutable Map of all entry data</li><li>**fieldsMetaData:** Immutable map of metadata from all fields.</li></ul> |
| [`schema`]  | `JSON Schema object`, optional | Enforces a schema for the widget's field configuration

**Example:**

`admin/index.html`

```html
<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
<script>
var CategoriesControl = createClass({
  handleChange: function(e) {
    const separator = this.props.field.get('separator', ', ')
    this.props.onChange(e.target.value.split(separator).map((e) => e.trim()));
  },

  render: function() {
    const separator = this.props.field.get('separator', ', ');
    var value = this.props.value;
    return h('input', {
      id: this.props.forID,
      className: this.props.classNameWrapper,
      type: 'text',
      value: value ? value.join(separator) : '',
      onChange: this.handleChange,
    });
  },
});

var CategoriesPreview = createClass({
  render: function() {
    return h('ul', {},
      this.props.value.map(function(val, index) {
        return h('li', {key: index}, val);
      })
    );
  }
});

var schema = {
  properties: {
    separator: { type: 'string' },
  },
}

CMS.registerWidget('categories', CategoriesControl, CategoriesPreview, schema);
</script>
```

`admin/config.yml`

```yml
collections:
  - name: posts
    label: Posts
    folder: content/posts
    fields:
      - name: title
        label: Title
        widget: string
      - name: categories
        label: Categories
        widget: categories
        separator: __
```

## `registerEditorComponent`

Register a block level component for the Markdown editor:

```js
CMS.registerEditorComponent(definition)
```

**Params**

* **definition:** The component definition; must specify: id, label, fields, patterns, fromBlock, toBlock, toPreview

**Example:**

```html
<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
<script>
CMS.registerEditorComponent({
  // Internal id of the component
  id: "youtube",
  // Visible label
  label: "Youtube",
  // Fields the user need to fill out when adding an instance of the component
  fields: [{name: 'id', label: 'Youtube Video ID', widget: 'string'}],
  // Pattern to identify a block as being an instance of this component
  pattern: /^youtube (\S+)$/,
  // Function to extract data elements from the regexp match
  fromBlock: function(match) {
    return {
      id: match[1]
    };
  },
  // Function to create a text block from an instance of this component
  toBlock: function(obj) {
    return 'youtube ' + obj.id;
  },
  // Preview output for this component. Can either be a string or a React component
  // (component gives better render performance)
  toPreview: function(obj) {
    return (
      '<img src="http://img.youtube.com/vi/' + obj.id + '/maxresdefault.jpg" alt="Youtube Video"/>'
    );
  }
});
</script>
```

**Result:**

![youtube-widget](/img/screen shot 2018-01-05 at 4.25.07 pm.png)

## Advanced field validation

All widget fields, including those for built-in widgets, [include basic validation](../widgets/#common-widget-options) capability using the `required` and `pattern` options.

With custom widgets, the widget control can also optionally implement an `isValid` method to perform custom validations, in addition to presence and pattern. The `isValid` method will be automatically called, and it can return either a boolean value, an object with an error message or a promise. Examples:

**Boolean**
No errors:

```javascript
  isValid = () => {
    // Do internal validation
    return true;
  };
```

Existing error:

```javascript
  isValid = () => {
    // Do internal validation
    return false;
  };
```

**Object with `error` (useful for returning custom error messages)**
Existing error:

```javascript
  isValid = () => {
    // Do internal validation
    return { error: { message: 'Your error message.' } };
  };
```

**Promise**
You can also return a promise from `isValid`. While the promise is pending, the widget will be marked as "in error". When the promise resolves, the error is automatically cleared.

```javascript
  isValid = () => {
    return this.existingPromise;
  };
```

**Note:** Do not create a promise inside `isValid` - `isValid` is called right before trying to persist. This means that even if a previous promise was already resolved, when the user hits 'save', `isValid` will be called again. If it returns a new promise, it will be immediately marked as "in error" until the new promise resolves.
