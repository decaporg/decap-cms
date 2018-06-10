---
title: Beta Features!
weight: 200
menu:
  docs:
    parent: reference
---
# Beta Features!
We run new functionality in an open beta format from time to time. That means that this functionality is totally available for use, and we _think_ it might be ready for primetime, but it could break or change without notice.

**Use these features at your own risk.**

## Custom Mount Element
Netlify CMS always creates it's own DOM element for mounting the application, which means it always
takes over the entire page, and is generally inflexible if you're trying to do something creative,
like injecting it into a shared context.

You can now provide your own element for Netlify CMS to mount in by setting the target element's ID
as `nc-root`. If Netlify CMS finds an element with this ID during initialization, it will mount
within that element instead of creating it's own.

## Manual Initialization
Netlify CMS can now be manually initialized, rather than automatically loading up the moment you import it. The whole point of this at the moment is to inject configuration into Netlify CMS before it loads, bypassing need for an actual Netlify CMS `config.yml`. This is important, for example, when creating tight integrations with static site generators.

Injecting config is technically already possible by setting `window.CMS_CONFIG` before importing/requiring/running Netlify CMS, but most projects are modular and don't want to use globals, plus `window.CMS_CONFIG` is an internal, not technically supported, and provides no validation.

Assuming you have the netlify-cms package installed to your project, manual initialization works like so:

```js
// This global flag enables manual initialization.
window.CMS_MANUAL_INIT = true

// Usage with import from npm package
import CMS, { init } from 'netlify-cms'

// Usage with script tag
const { CMS, initCMS: init } = window

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
CMS.registerPreviewTemplate(...);
```

## Raw CSS in `registerPreviewStyle`
`registerPreviewStyle` can now accept a CSS string, in addition to accepting a url. The feature is activated by passing in an object as the second argument, with `raw` set to a truthy value.This is critical for integrating with modern build tooling. Here's an example using webpack:

```js
/**
 * Assumes a webpack project with `sass-loader` and `css-loader` installed.
 * Takes advantage of the `toString` method in the return value of `css-loader`.
 */
import CMS from 'netlify-cms';
import styles from '!css-loader!sass-loader!../main.scss'

CMS.registerPreviewStyle(styles.toString(), { raw: true })
```

## Squash merge GitHub pull requests
When using the [Editorial Workflow](/docs/configuration-options/#publish-mode) with the `github` or GitHub-connected `git-gateway` backends, Netlify CMS creates a pull request for each unpublished entry. Every time the unpublished entry is changed and saved, a new commit is added to the pull request. When the entry is published, the pull request is merged, and all of those commits are added to your project commit history in a merge commit.

The squash merge option causes all commits to be "squashed" into a single commit when the pull request is merged, and the resulting commit is rebased onto the target branch, avoiding the merge commit altogether.

To enable this feature, you can set the following option in your Netlify CMS `config.yml`:

```yaml
backend:
  squash_merges: true
```

## Commit Message Templates
You can customize the templates used by Netlify CMS to generate commit messages by setting the `commit_messages` option under `backend` in your Netlify CMS `config.yml`.

Template tags wrapped in curly braces will be expanded to include information about the file changed by the commit. For example, `{{path}}` will include the full path to the file changed.

Setting up your Netlify CMS `config.yml` to recreate the default values would look like this:

```yaml
backend:
  commit_messages:
    create: Create {{collection}} “{{slug}}”
    update: Update {{collection}} “{{slug}}”
    delete: Delete {{collection}} “{{slug}}”
    uploadMedia: Upload “{{path}}”
    deleteMedia: Delete “{{path}}”
```

Netlify CMS generates the following commit types:

Commit type   | When is it triggered?        | Available template tags
--------------|------------------------------|-----------------------------
`create`      | A new entry is created       | `slug`, `path`, `collection`
`update`      | An existing entry is changed | `slug`, `path`, `collection`
`delete`      | An exising entry is deleted  | `slug`, `path`, `collection`
`uploadMedia` | A media file is uploaded     | `path`
`deleteMedia` | A media file is deleted      | `path`

Template tags produce the following output:

- `{{slug}}`: the url-safe filename of the entry changed

- `{{collection}}`: the name of the collection containing the entry changed

- `{{path}}`: the full path to the file changed
