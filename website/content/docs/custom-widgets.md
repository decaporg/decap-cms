---
title: Creating Custom Widgets
group: fields
weight: 35
---
The NetlifyCMS exposes a `window.CMS` a global object that you can use to register custom widgets, previews, and editor plugins. The same object is also the default export if you import Netlify CMS as an npm module. The available widget extension methods are:

* **registerWidget:** registers a custom widget.
* **registerEditorComponent:** adds a block component to the Markdown editor.

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

| Param       | Type                           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`      | `string`                       | Widget name, allows this widget to be used via the field `widget` property in config                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `control`   | `React.Component` or `string`  | <ul><li>React component that renders the control, receives the following props: <ul><li>**value:** Current field value</li><li>**field:** Immutable map of current field configuration</li><li>**forID:** Unique identifier for the field</li><li>**classNameWrapper:** class name to apply CMS styling to the field</li><li>**onChange:** Callback function to update the field value</li></ul></li><li>Name of a registered widget whose control should be used (includes built in widgets).</li></ul> |
| [`preview`] | `React.Component`, optional    | Renders the widget preview, receives the following props: <ul><li>**value:** Current preview value</li><li>**field:** Immutable map of current field configuration</li><li>**metadata:** Immutable map of any available metadata for the current field</li><li>**getAsset:** Function for retrieving an asset url for image/file fields</li><li>**entry:** Immutable Map of all entry data</li><li>**fieldsMetaData:** Immutable map of metadata from all fields.</li></ul>                              |
| [`schema`]  | `JSON Schema object`, optional | Enforces a schema for the widget's field configuration                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

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

### Writing custom widgets as a separate package

Widgets are inputs for the Netlify CMS editor interface. It's a React component that receives user input and outputs a serialized value. Those are the only rules - the component can be extremely simple, like text input, or extremely complicated, like a full-blown markdown editor. They can make calls to external services, and generally do anything that JavaScript can do.



1. Create a directory `mkdir my-custom-widget`.
2. Navigate to the directory `cd my-custom-widget`.
3. Run `npm init`.
4. Create a `src` directory with the files `Control.js`, `Preview.js` and `index.js`.
5. Install the following dependencies...
6. Create a Webpack configuration file...

We have created a boilerplate for creating Netlify CMS widgets. You can check the [netlify-cms-widget-starter](https://github.com/netlify/netlify-cms-widget-starter) out for a starter project to fork. The starter currently provides a basic string widget, which you can customize, extend, or replace entirely with your own widget.

### [](https://github.com/netlify/netlify-cms-widget-starter#getting-started)Getting started

Clone or fork the repo, then install dependencies:

```javascript
git clone --depth=1 https://github.com/netlify/netlify-cms-widget-starter.git netlify-cms-widget-<name>
cd netlify-cms-widget-<name>
npm install
```

### [](https://github.com/netlify/netlify-cms-widget-starter#development)Development

To run a copy of Netlify CMS with your widget loaded for development, use the start script:

```javascript
npm start
```

Your widget source is in the `src` directory, where there are separate files for the `Control` and `Preview` components.

### [](https://github.com/netlify/netlify-cms-widget-starter#production--publishing)Production & Publishing

You'll want to take a few steps before publishing a production built package to npm:

1. Customize `package.json` with details for your specific widget, e.g. name, description, author, version, etc.

   ```json
   {
     "name": "netlify-cms-widget-starter",
     "description": "A boilerplate for creating Netlify CMS widgets.",
     "author": "name of developer",
     "keywords": [
       "netlify",
       "netlify-cms",
       "cms",
       "widget",
       "starter",
       "boilerplate"
     ],
     "version": "0.0.1",
     // ... rest
   }
   ```
2. For discoverability, ensure that your package name follows the pattern `netlify-cms-widget-<name>`.
3. Delete this `README.md`, rename `README_TEMPLATE.md` to `README.md`, and update the new file for your specific widget.
4. Rename the exports in `src/index.js`. For example, if your widget is `netlify-cms-widget-awesome`, you would do:

```javascript
if (typeof window !== 'undefined') {
  window.AwesomeControl = Control
  window.AwesomePreview = Preview
}

export { Control as AwesomeControl, Preview as AwesomePreview }
```

5. Optional: customize the component and file names in `src`.
6. If you haven't already, push your repo to your GitHub account so the source available to other developers.
7. Create a production build, which will be output to `dist`:

```javascript
npm run build
```

8. Finally, if you're sure things are tested and working, publish!

```javascript
npm publish
```

### [](https://github.com/netlify/netlify-cms-widget-starter#deploying-a-live-demo)Deploying a live demo

The development (start) task provides a locally served preview of your widget in the CMS editor. This starter also includes a `demo` task for deploying this view live. Here's how to get your demo deployed using Netlify.

1. Assuming your repo is on GitHub, head over to Netlify and [create a site](https://app.netlify.com/start) from your repo.
2. The proper settings will be pre-filled based on what's in the `netlify.toml` file in this repo, so you can just click through to deploy.
3. Add your deployed site URL to `README.md`, replacing the placeholder URL in the demo link.

**Note:** Be sure to retain the "/demo" at the end of the URL, as that will automatically redirect to the editor view with your widget.

Once deployed, your demo should look like [this](https://netlify-cms-widget-starter.netlify.com/demo), except with your custom widget.