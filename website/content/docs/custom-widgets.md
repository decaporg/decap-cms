---
group: Fields
weight: 20
title: Creating Custom Widgets
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

> Additional properties are optional and will be passed to the underlying widget control (object widget by default). For example, adding a `collapsed: true` property will collapse the widget by default.

**Example:**

```html
<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
<script>
CMS.registerEditorComponent({
  // Internal id of the component
  id: "collapsible-note",
  // Visible label
  label: "Collapsible Note",
  // Fields the user need to fill out when adding an instance of the component
  fields: [
    {
      name: 'summary',
      label: 'Summary',
      widget: 'string'
    },
    {
      name: 'details',
      label: 'Details',
      widget: 'markdown'
    }
  ],
  // Regex pattern used to search for instances of this block in the markdown document.
  // Patterns are run in a multline environment (against the entire markdown document),
  // and so generally should make use of the multiline flag (`m`). If you need to capture
  // newlines in your capturing groups, you can either use something like
  // `([\S\s]*)`, or you can additionally enable the "dot all" flag (`s`),
  // which will cause `(.*)` to match newlines as well.
  //
  // Additionally, it's recommended that you use non-greedy capturing groups (e.g.
  // `(.*?)` vs `(.*)`), especially if matching against newline characters.
  pattern: /^<details>$\s*?<summary>(.*?)<\/summary>\n\n(.*?)\n^<\/details>$/ms,
  // Given a RegExp Match object
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match#return_value),
  // return an object with one property for each field defined in `fields`.
  //
  // This is used to populate the custom widget in the markdown editor in the CMS.
  fromBlock: function(match) {
    return {
      summary: match[1],
      detail: match[2]
    };
  },
  // Given an object with one property for each field defined in `fields`,
  // return the string you wish to be inserted into your markdown.
  //
  // This is used to serialize the data from the custom widget to the
  // markdown document
  toBlock: function(data) {
    return `
<details>
  <summary>${data.summary}</summary>

  ${data.detail}

</details>
`;
  },
  // Preview output for this component. Can either be a string or a React component
  // (component gives better render performance)
  toPreview: function(data) {
    return `
<details>
  <summary>${data.summary}</summary>

  ${data.detail}

</details>
`;
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

## Writing custom widgets as a separate package

Widgets are inputs for the Netlify CMS editor interface. It's a React component that receives user input and outputs a serialized value. Those are the only rules - the component can be extremely simple, like text input, or extremely complicated, like a full-blown markdown editor. They can make calls to external services, and generally do anything that JavaScript can do.

For writing custom widgets as a separate package you should follow these steps:

1. Create a directory 

   ```javascript
   mkdir my-custom-widget
   ```
2. Navigate to the directory 

   ```javascript
   cd my-custom-widget
   ```
3. For setting up a new npm package run this command:

   ```javascript
   npm init
   ```
4. Answer the questions in the command line questionnaire.
5. In order to build React components, we need to set up a build step. We'll be using Webpack. Please run the following commands to install the required dependencies:

```javascript
   npm install --save-dev babel-loader@7 babel-core babel-plugin-transform-class-properties babel-plugin-transform-export-extensions babel-plugin-transform-object-rest-spread babel-preset-env babel-preset-react cross-env css-loader html-webpack-plugin netlify-cms react source-map-loader style-loader webpack webpack-cli webpack-serve
```

```javascript
   npm install --save prop-types
```

And you should manually add "**peerDependencies**" and "**scripts**" as shown below.

Here is the content of `package.json` that you will have at the end:

```javascript
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
  "homepage": "https://github.com/netlify/netlify-cms-widget-starter",
  "license": "MIT",
  "main": "dist/main.js",
  "devDependencies": {
    "babel-loader": "^7.1.4",
    "babel-plugin-transform-class-properties": "^6.24.1",
    "babel-plugin-transform-export-extensions": "^6.22.0",
    "babel-plugin-transform-object-rest-spread": "^6.26.0",
    "babel-preset-env": "^1.6.1",
    "babel-preset-react": "^6.24.1",
    "cross-env": "^5.1.4",
    "css-loader": "^0.28.11",
    "html-webpack-plugin": "^3.2.0",
    "netlify-cms": "^1.5.0",
    "react": "^16.3.2",
    "source-map-loader": "^0.2.3",
    "style-loader": "^0.20.3",
    "webpack": "^4.6.0",
    "webpack-cli": "^2.0.14",
    "webpack-serve": "^0.3.1"
  },
  "dependencies": {
    "prop-types": "^15.6.1"
  },
  "peerDependencies": {
    "react": "^16"
  },
  "scripts": {
    "start": "webpack-serve --static public --open"
  }
}
```

5. Create a Webpack configuration file with this content:

   `webpack.config.js`

   ```javascript
   const path = require('path')
   const HtmlWebpackPlugin = require('html-webpack-plugin')

   const developmentConfig = {
     mode: 'development',
     entry: './dev/index.js',
     output: {
       path: path.resolve(__dirname, 'public'),
     },
     optimization: { minimize: false },
     module: {
       rules: [
         {
           test: /\.js$/,
           loader: 'source-map-loader',
           enforce: 'pre',
         },
         {
           test: /\.jsx?$/,
           exclude: /node_modules/,
           loader: 'babel-loader',
         },
         {
           test: /\.css$/,
           use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
         },
       ],
     },
     plugins: [
       new HtmlWebpackPlugin(),
     ],
     devtool: 'eval-source-map',
   }

   const productionConfig = {
     mode: 'production',
     module: {
       rules: [
         {
           test: /\.jsx?$/,
           loader: 'babel-loader',
         },
       ],
     },
     devtool: 'source-map',
   }

   module.exports = process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig
   ```
6. The `.babelrc` file is our local configuration for our code in the project. You should create it under the root of the application repo. It will affect all files that Babel processes. So, create a `.babelrc` file under the main project with this content:

```javascript
{
  "presets": [
    "react",
    "env",
  ],
  "plugins": [
    "transform-export-extensions",
    "transform-class-properties",
    "transform-object-rest-spread",
  ],
}
```

7. Create a `src` directory with the files `Control.js`, `Preview.js` and `index.js`

`src/Control.js`

```javascript
 import PropTypes from 'prop-types';
 import React from 'react';

 export default class Control extends React.Component {
   static propTypes = {
     onChange: PropTypes.func.isRequired,
     forID: PropTypes.string,
     value: PropTypes.node,
     classNameWrapper: PropTypes.string.isRequired,
   }

   static defaultProps = {
     value: '',
   }

   render() {
     const {
       forID,
       value,
       onChange,
       classNameWrapper,
     } = this.props;

     return (
       <input
         type="text"
         id={forID}
         className={classNameWrapper}
         value={value || ''}
         onChange={e => onChange(e.target.value)}
       />
     );
   }
 }
```

`src/Preview.js`

```javascript
import PropTypes from 'prop-types';
import React from 'react';

export default function Preview({ value }) {
  return <div>{ value }</div>;
}

Preview.propTypes = {
  value: PropTypes.node,
};
```

`src/index.js`

```javascript
import Control from './Control'
import Preview from './Preview'

if (typeof window !== 'undefined') {
  window.Control = Control
  window.Preview = Preview
}

export { Control, Preview }
```

8. Now you need to set up the locale example site.
   Under the main project, create a `dev` directory with the files `bootstrap.js` and `index.js`

`bootstrap.js`

```javascript
window.CMS_MANUAL_INIT = true
```

`index.js`

```javascript
import './bootstrap.js'
import CMS, { init } from 'netlify-cms'
import 'netlify-cms/dist/cms.css'
import { Control, Preview } from '../src'

const config = {
backend: {
 name: 'test-repo',
 login: false,
},
media_folder: 'assets',
collections: [{
 name: 'test',
 label: 'Test',
 files: [{
   file: 'test.yml',
   name: 'test',
   label: 'Test',
   fields: [
     { name: 'test_widget', label: 'Test Widget', widget: 'test'},
   ],
 }],
}],
}

CMS.registerWidget('test', Control, Preview)

init({ config })
```

### [](https://github.com/netlify/netlify-cms-widget-starter#development)Development

To run a copy of Netlify CMS with your widget for development, use the start script:

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
