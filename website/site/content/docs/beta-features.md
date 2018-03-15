---
title: Beta Features!
position: 200
---
# Beta Features!
We run new functionality in an open beta format from time to time. That means that this functionality is totally available for use, and we _think_ it might be ready for primetime, but it could break or change without notice.

**Use these features at your own risk.**

## Manual Initialization
Netlify CMS can now be manually initialized, rather than automatically loading up the moment you import it. The whole point of this at the moment is to inject configuration into Netlify CMS before it loads, bypassing need for an actual config.yml. This is important, for example, when creating tight integrations with static site generators.

Injecting config is technically already possible by setting `window.CMS_CONFIG` before importing/requiring/running Netlify CMS, but most projects are modular and don't want to use globals, plus `window.CMS_CONFIG` is an internal, not technically supported, and provides no validation. Therefore, we'll focus on manual initialization via the npm package.

Assuming you have the netlify-cms package installed to your project, manual initialization works like so:

```js
import { init, registry } from 'netlify-cms/dist/init'

/**
 * Initialize without passing in config - equivalent to just importing
 * Netlify CMS the old way.
 */

init()

/**
 * Optionally pass in a config object. This object will be merged into
 * `config.yml` if it exists, and any portion that conflicts with
 * `config.yml` will be overwritten. Arrays will be replaced during merge,
 * not concatenated.
 *
 * For example, the code below contains an incomplete config, but using it,
 * your `config.yml` can be missing it's backend property, allowing you
 * to set this property at runtime.
 */

init({
  config: {
    backend: {
      name: 'git-gateway',
    },
  },
})

// The registry works as expected, and can be used before or after init.
registry.registerPreviewTemplate(...);
```
