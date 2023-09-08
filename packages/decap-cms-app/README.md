# Decap CMS App
_For a Decap CMS overview, see the general [Decap CMS project README](https://github.com/decaporg/decap-cms)._

## Community Chat

<a href="https://decapcms.org/chat">
  <img alt="Join us on Discord" src="https://raw.githubusercontent.com/decaporg/decap-cms/master/website/static/img/discord.png" width="165">
</a>

## Purpose
This package is similar to the [`decap-cms`](https://github.com/decaporg/decap-cms/tree/master/packages/decap-cms/) package, but is designed for use with extensions. It serves that purpose in the following ways.

- It does not automatically initialize - you must run the CMS `init` method.
- It does not include `react` or `react-dom` - they are required as peer dependencies.
- It does not include the following extensions:
  - [`decap-cms-media-library-cloudinary`]
  - [`decap-cms-media-library-uploadcare`]
  
## Usage
Install via script tag:

```html
<!-- Excluding `doctype` and `head` but you should add them -->
<body>
  <!-- Add these scripts to the bottom of the body -->
  <script src="https://unpkg.com/react@^16/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@^16/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/decap-cms-app/dist/decap-cms-app.js"></script>
  
  <!-- Initialize the CMS -->
  <script>
    DecapCmsApp.init();
  </script>
</body>
```

Install via npm:

```
npm i react react-dom decap-cms-app
```

```js
import CMS from 'decap-cms-app';

CMS.init();
```
