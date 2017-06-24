# Extending With Widgets

The NetlifyCMS exposes an `window.CMS` global object that you can use to register custom widgets, previews and editor plugins. The available widget extension methods are:

* **registerWidget** lets you register a custom widget.
* **registerEditorComponent** lets you add a block component to the Markdown editor

### Writing React Components inline

The registerWidget requires you to provide a React component. If you have a build process in place for your project, it is possible to integrate

Although possible, it may be cumbersome or even impractical to add a React build phase. For this reason, NetlifyCMS exposes two constructs globally to allow you to create components inline: ‘createClass’ and ‘h’ (alias for React.createElement).

## `registerWidget`

Register a custom widget.

```js
CMS.registerWidget(field, control, \[preview\])
```

**Params:**

* **field:** The field type which this widget will be used for.
* **control:** A React component that renders the editing interface for this field. Two props will be passed:
  * **value:** The current value for this field.
  * **onChange:** Callback function to update the field value.
* **preview (optional):** A React component that renders the preview of how the content will look. A `value` prop will be passed to this component.

**Example:**

```html
<script src="https://unpkg.com/netlify-cms@~0.4/dist/cms.js"></script>
<script>
var CategoriesControl = createClass({
  handleChange: function(e) {
    this.props.onChange(e.target.value.split(',').map((e) => e.trim()));
  },

  render: function() {
    var value = this.props.value;
    return h('input', { type: 'text', value: value ? value.join(', ') : '', onChange: this.handleChange });
  }
});

CMS.registerWidget('categories', CategoriesControl);
</script>
```

## `registerEditorComponent`

Register a block level component for the Markdown editor

    CMS.registerEditorComponent(definition)

**Params**

* **definition:** The component definition, must specify: id, label, fields, patterns, fromBlock, toBlock, toPreview

**Example:**

```html
<script src="https://unpkg.com/netlify-cms@~0.4/dist/cms.js"></script>
<script>
CMS.registerEditorComponent({
  // Internal id of the component
  id: "youtube",
  // Visible label
  label: "Youtube",
  // Fields the user need to fill out when adding an instance of the component
  fields: [{name: 'id', label: 'Youtube Video ID', widget: 'string'}],
  // Pattern to identify a block as being an instance of this component
  pattern: youtube (\S+)\s,
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
  // (Component gives better render performance)
  toPreview: function(obj) {
    return (
      '<img src="http://img.youtube.com/vi/' + obj.id + '/maxresdefault.jpg" alt="Youtube Video"/>'
    );
  }
});
</script>
```

**Result:**

![youtube-widget](/img/youtube-widget.png)

