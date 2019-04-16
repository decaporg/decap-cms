---
title: Creating Custom Previews
weight: 50
group: customization
---

The NetlifyCMS exposes a `window.CMS` global object that you can use to register custom widgets, previews and editor plugins. The available customization methods are:

* **registerPreviewStyle:** Register a custom stylesheet to use on the preview pane.
* **registerPreviewTemplate:** Registers a template for a collection.

### React Components inline interaction

NetlifyCMS is a collection of React components and exposes two constructs globally to allow you to create components inline: ‘createClass’ and ‘h’ (alias for React.createElement).

## `registerPreviewStyle`

Register a custom stylesheet to use on the preview pane.

```js
CMS.registerPreviewStyle(file);
```

**Params:**

* **file:** css file path

**Example:**

```html
// index.html
<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
<script>
  CMS.registerPreviewStyle("/example.css");
</script>
```

```css
/* example.css */

html,
body {
  color: #444;
  font-size: 14px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

body {
  padding: 20px;
}
```

## `registerPreviewTemplate`

Registers a template for a folder collection or an individual file in a file collection.

`CMS.registerPreviewTemplate(name, react_component);`

**Params:**

* name: The name of the collection (or file for file collections) which this preview component will be used for.
  * Folder collections: Use the name of the collection
  * File collections: Use the name of the file
* react_component: A React component that renders the collection data. Four props will be passed to your component during render:
  * entry: Immutable collection containing the entry data.
  * widgetFor: Returns the appropriate widget preview component for a given field.
  * [widgetsFor](#lists-and-objects): Returns an array of objects with widgets and associated field data. For use with list and object type entries.
  * getAsset: Returns the correct filePath or in-memory preview for uploaded images.
    **Example:**

    ```html
    <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
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
    ### Lists and Objects
    The API for accessing the individual fields of list- and object-type entries is similar to the API for accessing fields in standard entries, but there are a few key differences. Access to these nested fields is facilitated through the `widgetsFor` function, which is passed to the preview template component during render.
	**Note**: as is often the case with the NetlifyCMS API, arrays and objects are created with Immutable.js. If some of the methods that we use are unfamiliar, such as `getIn`, check out [their docs](https://facebook.github.io/immutable-js/docs/#/) to get a better understanding.
    **List Example:**
    ```html
    <script>
    var AuthorsPreview = createClass({
      // For list fields, the widgetFor function returns an array of objects
      // that you can map over in your template. If our field is a list of
      // authors containing two entries, with fields `name` and `description`,
      // the return value of `widgetsFor` would look like this:
      //
      // [{
      //   data: { name: 'Mathias', description: 'Co-Founder'},
      //   widgets: { name: (<WidgetComponent>), description: (WidgetComponent>)}
      // },
      // {
      //   data: { name: 'Chris', description: 'Co-Founder'},
      //   widgets: { name: (<WidgetComponent>), description: (WidgetComponent>)}
      // }]
      //
      // Templating would look something like this:

      render: function() {
        return h('div', {},

          // This is a static header that would only be rendered once for the entire list
          h('h1', {}, 'Authors'),

          // Here we provide a simple mapping function that will be applied to each
          // object in the array of authors
          this.props.widgetsFor('authors').map(function(author, index) {
            return h('div', {key: index},
              h('hr', {}),
              h('strong', {}, author.getIn(['data', 'name'])),
              author.getIn(['widgets', 'description'])
            );
          })
        );
      }
    });

    CMS.registerPreviewTemplate("authors", AuthorsPreview);
    </script>
    ```
    **Object Example:**
    ```html
    <script>
    var GeneralPreview = createClass({
      // Object fields are simpler than lists - instead of `widgetsFor` returning
      // an array of objects, it returns a single object. Accessing the shape of
      // that object is the same as the shape of objects returned for list fields:
      //
      // {
      //   data: { front_limit: 0, author: 'Chris' },
      //   widgets: { front_limit: (<WidgetComponent>), author: (WidgetComponent>)}
      // }
      render: function() {
        var entry = this.props.entry;
        var title = entry.getIn(['data', 'site_title']);
        var posts = entry.getIn(['data', 'posts']);

        return h('div', {},
          h('h1', {}, title),
          h('dl', {},
            h('dt', {}, 'Posts on Frontpage'),
            h('dd', {}, this.props.widgetsFor('posts').getIn(['widgets', 'front_limit']) || 0),

            h('dt', {}, 'Default Author'),
            h('dd', {}, this.props.widgetsFor('posts').getIn(['data', 'author']) || 'None'),
          )
        );
      }
    });

    CMS.registerPreviewTemplate("general", GeneralPreview);
    </script>
    ```
    ### Accessing Metadata
    Preview Components also receive an additional prop: `fieldsMetaData`. It contains aditional information (besides the plain textual value of each field) that can be useful for preview purposes. For example, the Relation widget passes the whole selected relation data in `fieldsMetaData`.
    ```js
    export default class ArticlePreview extends React.Component {
      render() {
        const {entry, fieldsMetaData} = this.props;
        const author = fieldsMetaData.getIn(['authors', data.author]);

        return <article><h2>{ entry.getIn(['data', 'title']) }</h2>
          {author &&<AuthorBio author={author.toJS()}/>}
        </article>
      }
    }
    ```
