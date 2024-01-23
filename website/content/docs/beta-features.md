---
group: Configuration
weight: 200
title: Beta Features!
---
We run new functionality in an open beta format from time to time. That means that this functionality is totally available for use, and we *think* it might be ready for primetime, but it could break or change without notice.

**Use these features at your own risk.**


## GitLab and BitBucket Editorial Workflow Support

***added in `netlify-cms@2.10.6` / `netlify-cms-app@2.11.3`***

You can enable the Editorial Workflow with the following line in your Decap CMS `config.yml` file:

```yaml
publish_mode: editorial_workflow
```

In order to track unpublished entries statuses the GitLab implementation uses merge requests labels and the BitBucket implementation uses pull requests comments.





## List Widget: Variable Types

Before this feature, the [list widget](/docs/widgets/#list) allowed a set of fields to be repeated, but every list item had the same set of fields available. With variable types, multiple named sets of fields can be defined, which opens the door to highly flexible content authoring (even page building) in Decap CMS.

**Note: this feature does not yet support default previews and requires [registering a preview template](/docs/customization#registerpreviewtemplate) in order to show up in the preview pane.**

To use variable types in the list widget, update your field configuration as follows:

1. Instead of defining your list fields under `fields` or `field`, define them under `types`. Similar to `fields`, `types` must be an array of field definition objects.
2. Each field definition under `types` must use the `object` widget (this is the default value for
   `widget`).

### Additional list widget options

* `types`: a nested list of object widgets. All widgets must be of type `object`. Every object widget may define different set of fields.
* `typeKey`: the name of the field that will be added to every item in list representing the name of the object widget that item belongs to. Ignored if `types` is not defined. Default is `type`.
* `summary`: allows customization of a collapsed list item object in a similar way to a [collection summary](/docs/configuration-options/?#summary)

### Example Configuration

The example configuration below imagines a scenario where the editor can add two "types" of content,
either a "carousel" or a "spotlight". Each type has a unique name and set of fields.

```yaml
- label: 'Home Section'
  name: 'sections'
  widget: 'list'
  types:
    - label: 'Carousel'
      name: 'carousel'
      widget: object
      summary: '{{fields.header}}'
      fields:
        - { label: Header, name: header, widget: string, default: 'Image Gallery' }
        - { label: Template, name: template, widget: string, default: 'carousel.html' }
        - label: Images
          name: images
          widget: list
          field: { label: Image, name: image, widget: image }
    - label: 'Spotlight'
      name: 'spotlight'
      widget: object
      fields:
        - { label: Header, name: header, widget: string, default: 'Spotlight' }
        - { label: Template, name: template, widget: string, default: 'spotlight.html' }
        - { label: Text, name: text, widget: text, default: 'Hello World' }
```

### Example Output

The output for the list widget will be an array of objects, and each object will have a `type` key
with the name of the type used for the list item. The `type` key name can be customized via the
`typeKey` property in the list configuration.

If the above example configuration were used to create a carousel, a spotlight, and another
carousel, the output could look like this:

```yaml
title: Home
sections:
  - type: carousel
    header: Image Gallery
    template: carousel.html
    images:
      - images/image01.png
      - images/image02.png
      - images/image03.png
  - type: spotlight
    header: Spotlight
    template: spotlight.html
    text: Hello World
  - type: carousel
    header: Image Gallery
    template: carousel.html
    images:
      - images/image04.png
      - images/image05.png
      - images/image06.png
```

## Custom Mount Element

Decap CMS always creates its own DOM element for mounting the application, which means it always takes over the entire page, and is generally inflexible if you're trying to do something creative, like injecting it into a shared context.

You can now provide your own element for Decap CMS to mount in by setting the target element's ID as `nc-root`. If Decap CMS finds an element with this ID during initialization, it will mount within that element instead of creating its own.

## Manual Initialization

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

## Raw CSS in `registerPreviewStyle`

`registerPreviewStyle` can now accept a CSS string, in addition to accepting a url. The feature is activated by passing in an object as the second argument, with `raw` set to a truthy value. This is critical for integrating with modern build tooling. Here's an example using webpack:

```js
/**
 * Assumes a webpack project with `sass-loader` and `css-loader` installed.
 * Takes advantage of the `toString` method in the return value of `css-loader`.
 */
import CMS from 'decap-cms-app';
import styles from '!css-loader!sass-loader!../main.scss';
CMS.registerPreviewStyle(styles.toString(), { raw: true });
```

## Squash merge GitHub pull requests

When using the [Editorial Workflow](../configuration-options/#publish-mode) with the `github` or GitHub-connected `git-gateway` backends, Decap CMS creates a pull request for each unpublished entry. Every time the unpublished entry is changed and saved, a new commit is added to the pull request. When the entry is published, the pull request is merged, and all of those commits are added to your project commit history in a merge commit.

The squash merge option causes all commits to be "squashed" into a single commit when the pull request is merged, and the resulting commit is rebased onto the target branch, avoiding the merge commit altogether.

To enable this feature, you can set the following option in your Decap CMS `config.yml`:

```yaml
backend:
  squash_merges: true
```


## Image widget file size limit

You can set a limit to as what the maximum file size of a file is that users can upload directly into a image field.

Example config:

```yaml
- label: 'Featured Image'
  name: 'thumbnail'
  widget: 'image'
  default: '/uploads/chocolate-dogecoin.jpg'
  media_library:
    config:
      max_file_size: 512000 # in bytes, only for default media library
```

## Summary string template transformations

You can apply transformations on fields in a summary string template using filter notation syntax.

Example config:

```yaml
collections:
  - name: 'posts'
    label: 'Posts'
    folder: '_posts'
    summary: "{{title | upper}} - {{date | date('YYYY-MM-DD')}} – {{body | truncate(20, '***')}}"
    fields:
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Publish Date', name: 'date', widget: 'datetime' }
      - { label: 'Body', name: 'body', widget: 'markdown' }
```

The above config will transform the title field to uppercase and format the date field using `YYYY-MM-DD` format.
Available transformations are `upper`, `lower`, `date('<format>')`, `default('defaultValue')`, `ternary('valueForTrue','valueForFalse')` and `truncate(<number>)`/`truncate(<number>, '<string>')`  

## Registering to CMS Events

You can execute a function when a specific CMS event occurs.

Example usage:

```javascript
CMS.registerEventListener({
  name: 'prePublish',
  handler: ({ author, entry }) => console.log(JSON.stringify({ author, data: entry.get('data') })),
});
```

Supported events are `prePublish`, `postPublish`, `preUnpublish`, `postUnpublish`, `preSave` and `postSave`. The `preSave` hook can be used to modify the entry data like so:

```javascript
CMS.registerEventListener({
  name: 'preSave',
  handler: ({ entry }) => {
    return entry.get('data').set('title', 'new title');
  },
});
```

## Dynamic Default Values

When linking to `/admin/#/collections/posts/new` you can pass URL parameters to pre-populate an entry.

For example given the configuration:

```yaml
collections:
  - name: posts
    label: Posts
    folder: content/posts
    create: true
    fields:
      - label: Title
        name: title
        widget: string
      - label: Object
        name: object
        widget: object
        fields:
          - label: Title
            name: title
            widget: string
      - label: body
        name: body
        widget: markdown
```

clicking the following link: `/#/collections/posts/new?title=first&object.title=second&body=%23%20content`

will open the editor for a new post with the `title` field populated with `first`, the nested `object.title` field
with `second` and the markdown `body` field with `# content`.

**Note:** URL Encoding might be required for certain values (e.g. in the previous example the value for `body` is URL encoded).


## Remark plugins

You can register plugins to customize [`remark`](https://github.com/remarkjs/remark), the library used by the richtext editor for serializing and deserializing markdown.

```js
// register a plugin
CMS.registerRemarkPlugin(plugin);

// provide global settings to all plugins, e.g. for customizing `remark-stringify`
CMS.registerRemarkPlugin({ settings: { bullet: '-' } });
```

Note that `netlify-widget-markdown` currently uses `remark@10`, so you should check a plugin's compatibility first.

## Custom formatters

To manage content with other file formats than the built in ones, you can register a custom formatter:

```js
const JSON5 = require('json5');

CMS.registerCustomFormat('json5', 'json5', {
  fromFile: text => JSON5.parse(text),
  toFile: value => JSON5.stringify(value, null, 2),
});
```

Then include `format: json5` in your collection configuration. See the [Collection docs](https://www.netlifycms.org/docs/configuration-options/#collections) for more details.

You can also override the in-built formatters. For example, to change the YAML serialization method from [`yaml`](https://npmjs.com/package/yaml) to [`js-yaml`](https://npmjs.com/package/js-yaml):

```js
const jsYaml = require('js-yaml');

CMS.registerCustomFormat('yml', 'yml', {
  fromFile: text => jsYaml.load(text),
  toFile: value => jsYaml.dump(value),
});
```
