---
title: Manual Initialization
weight: 70
group: Customization
---

Decap CMS can now be manually initialized, rather than automatically loading up the moment you import it. The whole point of this at the moment is to inject configuration into Decap CMS before it loads, bypassing need for an actual Decap CMS `config.yml`. This is important, for example, when creating tight integrations with static site generators.

Assuming you have the decap-cms package installed to your project, manual initialization works by setting `window.CMS_MANUAL_INIT = true` **before importing the CMS**:

```js
// This global flag enables manual initialization.
window.CMS_MANUAL_INIT = true
// Usage with import from npm package
import CMS, { init } from 'decap-cms-app'
// Usage with script tag
const { CMS, initCMS: init } = window
/**
 * Initialize without passing in config - equivalent to just importing
 * Decap CMS the old way.
 */
init()
/**
 * Optionally pass in a config object. This object will be merged into
 * `config.yml` if it exists, and any portion that conflicts with
 * `config.yml` will be overwritten. Arrays will be replaced during merge,
 * not concatenated.
 *
 * For example, the code below contains an incomplete config, but using it,
 * your `config.yml` can be missing its backend property, allowing you
 * to set this property at runtime.
 */
init({
  config: {
    backend: {
      name: 'git-gateway',
    },
  },
})
/**
 * Optionally pass in a complete config object and set a flag
 *  (`load_config_file: false`) to ignore the `config.yml`.
 *
 * For example, the code below contains a complete config. The
 * `config.yml` will be ignored when setting `load_config_file` to false.
 * It is not required if the `config.yml` file is missing to set
 * `load_config_file`, but will improve performance and avoid a load error.
 */
init({
  config: {
    backend: {
      name: 'git-gateway',
    },
    load_config_file: false,
    media_folder: "static/images/uploads",
    public_folder: "/images/uploads",
    collections: [
      { label: "Blog", name: "blog", folder: "_posts/blog", create: true, fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Publish Date", name: "date", widget: "datetime" },
        { label: "Featured Image", name: "thumbnail", widget: "image" },
        { label: "Body", name: "body", widget: "markdown" },
      ]},
    ],
  },
})
// The registry works as expected, and can be used before or after init.
CMS.registerPreviewTemplate(...);
```
