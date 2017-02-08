# Extending Netlify CMS
The Netlify CMS exposes an `window.CMS` global object that you can use to register custom widgets, previews and editor plugins. The available methods are:

* **registerPreviewStyle** Register a custom stylesheet to use on the preview pane.
* **registerPreviewTemplate** Registers a template for a collection.
* **registerWidget** lets you register a custom widget.
* **registerEditorComponent** lets you add a block component to the Markdown editor

**Writing React Components inline**

Both registerPreviewTemplate and registerWidget requires you to provide a React component. If you have a build process in place for your project, it is possible to integrate webpack and Babel for a complete React build flow.

Although possible, it may be cumbersome or even impractical to add a React build phase. For this reason, Netlify CMS exposes two React constructs globally to allow you to create components inline: ‘createClass’ and ‘h’ (alias for React.createElement).


## `registerPreviewStyle`

Register a custom stylesheet to use on the preview pane.

`CMS.registerPreviewStyle(file);`

**Params:**

* file: css file path.

**Example:**

`CMS.registerPreviewStyle("/example.css");`


## `registerPreviewTemplate`

Registers a template for a collection.

`CMS.registerPreviewTemplate(collection, react_component);`

**React Component Props:**

* collection: The name of the collection which this preview component will be used for.
* react_component: A React component that renders the collection data. Three props will be passed to your component during render:
  * entry: Immutable collection containing the entry data.
  * widgetFor: Returns the appropriate widget preview component for a given field.
  * getAsset: Returns the correct filePath or in-memory preview for uploaded images.

**Example:**

```html
<script>
var PostPreview = createClass({
  render: function() {
    var entry = this.props.entry;
    var image = entry.getIn(['data', 'image']);
    var bg = this.props.getAsset(image);
    return h('div', {},
      h('h1', {}, entry.getIn(['data', 'title'])),
      h('img', {src: bg.toString()}),
      h('div', {"className": "text"}, this.props.widgetFor('body'))
    );
  }
});

CMS.registerPreviewTemplate("posts", PostPreview);
</script>
```

### Accessing Metadata
Preview Components also receive an additional prop: `fieldsMetaData`. It contains aditional information (besides the plain plain textual value of each field) that can be useful for preview purposes. 

For example, the Relation widget passes the whole selected relation data in fieldsMetaData.

```js
export default class ArticlePreview extends React.Component {
  render() {
    const {entry, fieldsMetaData} = this.props;
    const author = fieldsMetaData.getIn(['authors', data.author]);

    return <article>
      <h2>{ entry.getIn(['data', 'title']) }</h2>
      {author && <AuthorBio author={author.toJS()}/>}
    </article>
  }
}
```

## `registerWidget`

lets you register a custom widget.

`CMS.registerWidget(field, control, [preview])`

**Params:**

* field: The field type which this widget will be used for.
* control: A React component that renders the editing interface for this field. Two props will be passed:
  * value: The current value for this field.
  * onChange: Callback function to update the field value.
* preview (optional): A React component that renders the preview of how the content will look. A `value` prop will be passed to this component.


**Example:**

```html
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

lets your register a block level component for the Markdown editor

`CMS.registerEditorComponent(definition)`

**Params**

* definition: The component definition, must specify: id, label, fields, patterns, fromBlock, toBlock, toPreview

**Example:**

```js
CMS.registerEditorComponent({
  // Internal id of the component
  id: "youtube",
  // Visible label
  label: "Youtube",
  // Fields the user need to fill out when adding an instance of the component
  fields: [{name: 'id', label: 'Youtube Video ID', widget: 'string'}],
  // Pattern to identify a block as being an instance of this component
  pattern: /^{{<\s?youtube (\S+)\s?>}}/,
  // Function to extract data elements from the regexp match
  fromBlock: function(match) {
    return {
      id: match[1]
    };
  },
  // Function to create a text block from an instance of this component
  toBlock: function(obj) {
    return '{{< youtube ' + obj.id + ' >}}';
  },
  // Preview output for this component. Can either be a string or a React component
  // (Component gives better render performance)
  toPreview: function(obj) {
    return (
      '<img src="http://img.youtube.com/vi/' + obj.id + '/maxresdefault.jpg" alt="Youtube Video"/>'
    );
  }
});
```
