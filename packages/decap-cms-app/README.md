# Decap CMS App
_For a Decap CMS overview, see the general [Decap CMS project README](https://github.com/decaporg/decap-cms)._

## Purpose
This package is similar to the [`decap-cms`](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms/) package, but is designed for use with extensions. It serves that purpose in the following ways.

- It does not automatically initialize - you must run the CMS `init` method.
- It does not include `react` or `react-dom` - they are required as peer dependencies.
- It does not include the following extensions:
  - [`decap-cms-media-library-cloudinary`]
  - [`decap-cms-media-library-uploadcare`]
  - [`decap-cms-media-library-s3`]
  
## Usage
`decap-cms-app` is meant to be installed from npm and bundled with your own build tool (webpack, Vite, etc.). Install it with React 19:

```sh
npm i decap-cms-app react react-dom
```

```js
import CMS from 'decap-cms-app';

CMS.init();
```

### Script tag
`decap-cms-app` cannot be loaded from a CDN with a script tag: its browser build expects `React` and `ReactDOM` as globals, and React 19 no longer ships UMD builds that provide them. For a script-tag install, use the [`decap-cms`](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms/) package instead. It bundles React and exposes the same API as `window.CMS`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Content Manager</title>
  </head>
  <body>
    <!-- Optional: skip automatic initialization so you can call `CMS.init()` yourself -->
    <script>
      window.CMS_MANUAL_INIT = true;
    </script>
    <script src="https://cdn.jsdelivr.net/npm/decap-cms@^3.0.0/dist/decap-cms.js"></script>
    <script>
      // Register extensions here, e.g. CMS.registerPreviewTemplate(...)
      CMS.init();
    </script>
  </body>
</html>
```

Without `window.CMS_MANUAL_INIT`, `decap-cms` initializes itself as soon as it loads, and the extra `CMS.init()` script is not needed. The bundle also sets `window.h` (React's `createElement`) and `window.createClass`, for writing preview templates without a build step.
