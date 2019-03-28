# Netlify CMS App
[![](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/netlify/netlifycms)

_For a Netlify CMS overview, see the general [Netlify CMS project README](https://github.com/netlify/netlify-cms)._

## Purpose
This package is similar to the [`netlify-cms`](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms/) package, but is designed for use with extensions. It serves that purpose in the following ways.

- It does not automatically initialize - you must run the CMS `init` method.
- It does not include `react` or `react-dom` - they are required as peer dependencies.
- It does not include the following extensions:
  - [`netlify-cms-media-library-cloudinary`]
  - [`netlify-cms-media-library-uploadcare`]
  
## Usage
Install via script tag:

```html
<!-- Excluding `doctype` and `head` but you should add them -->
<body>
  <!-- Add these scripts to the bottom of the body -->
  <script src="https://unpkg.com/react@^16/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@^16/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/netlify-cms-app/dist/netlify-cms-app.js"></script>
  
  <!-- Initialize the CMS -->
  <script>
    NetlifyCmsApp.init();
  </script>
</body>
```

Install via npm:

```
npm i react react-dom netlify-cms-app
```

```js
import CMS from 'netlify-cms-app';

CMS.init();
```
