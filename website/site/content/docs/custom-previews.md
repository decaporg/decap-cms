---
title: Custom Previews
position: 50
---

# Customizing the Preview Pane

The preview pane displays an HTML preview of the content you're editing, and can be customized to
display content identical to your production site using templates and CSS.

## Preview Templates

Preview templates are regular templates that are updated in realtime as an entry is being
edited. Netlify CMS uses [template compilers](#) to support different template languages. React
components are supported without any compiler, and a Handlebars compiler is included by
default.

### Writing a Basic Template

Let's look at an example template written in Handlebars. To create a template for use with a
collection, we'll start by observing the `fields` configuration for the collection:

```yaml
# this snippet is from the main Netlify CMS configuration file, typically config.yml

fields:
  - { name: title, label: Title, widget: string }
  - { name: text, label: Text, widget: text }
```

A preview template displaying these fields might look like this:

```handlebars
<div>
  <h1>{{ title }}</h1>
  <p>{{ text }}</p>
</div>
```

You can add styles and classes as necessary to make the preview match your production site.


### Registering Templates

Once you have a template, you'll need to register it to be used with a collection. We're
using a handlebars template, so we'll only need to provide a name for the template and the template
itself.

```js
// You can pull in your template in a number of ways, but we'll go with an
// inline template for simplicity.
const template = `
<div>
  <h1>{{ title }}</h1>
  <p>{{ text }}</p>
</div>
`

CMS.registerPreviewTemplate('blog', template)
```

Registering a template may require other arguments depending on your template compiler. For more
information on `registerPreviewTemplate`, check out the [API docs](#), as well as the docs for your
template compiler.

Now that you've registered your template, you'll want to add use it in one or more collections. This
happens in your CMS configuration file via the `preview_template` key for a collection. Applying the
"blog" template we just registered to a collection named "posts" would look like this:

```yaml
collections:
  name: posts
  label: Posts
  preview_template: blog
```

### Using Field Previews

When a preview template accesses a field value, it receives the raw value itself. This is the same
value that is output when an entry is saved, and is produced by the field widget's [control
component](#).  Many widgets also have a [preview component](#) that outputs an HTML representation of
the field's value specifically for use in the preview pane. This is referred to as the Field
Preview.

We'll use a Markdown field to demonstrate. Here's a YAML file with a couple of fields:

```yaml
title: Blog Post
description: A **brand new** post.
```

The "title" field is just a string value, but the "description" field contains markdown. We'll
assume the configuration file is using the "markdown" widget for the description field.

```handlebars
<div>
  <h1>{{ title }}</h1>
  {{ description }}
</div>
```

The above template accesses the value of the "description" field directly, so the preview pane would
receive:

```html
<div>
  <h1>Blog Post</h1>
  A *brand new* post.
</div>
```

We don't want to display raw markdown in the preview pane like this - we want the HTML
representation of the markdown instead, which is exactly what the Markdown widget's preview
component provides. This may differ for some template compilers, but previews are generally
accessible through the `__preview` object by prepending "__preview" to your key.

In other words, take the key you would normally access your value with, and put "__preview." at the
beginning. In our case, `description` becomes `__preview.description`.

```handlebars
<div>
  <h1>{{ title }}</h1>
  {{ __preview.description }}
</div>
```

```html
<div>
  <h1>Blog Post</h1>
  <p>
    A <strong>brand new</strong> post.
  </p>
</div>
```

Because we used the field preview of `description`, instead of the regular field value the preview
pane now has an HTML representation of the Markdown field. Note that the preview helper function is
specific to the Handlebars template compiler - if you're using a different template language, check
the documentation for whatever compiler you're using.


### Accessing Metadata

Sometimes other data is available in addition to the field values and field previews. For example,
the [Relation widget](#) allows the user to select a single entry from a collection, and stores a
single field value from the selected entry, but the rest of the entry is also made available to the
preview template as metadata.

Metadata is accessed similarly to field previews - by prepending the key `__meta` and appending the
path to the metadata. If a relation field named `related_post` captured the title of a selected
entry, and you wanted to access the `author` field in that selected entry, you could do so with
metadata.

Here's an example of this scenario showing the output of `related_post` and the output of
`__meta.related_post.author`.

First the entry we're previewing:

```yaml
title: Blog Post
author: Jane Doe
related_post: Other Blog Post
```

Then the related post that we selected:

```yaml
title: Other Blog Post
author: Willy Williams
```

Using these two posts, the template and output would be:

```handlebars
<div>
  <h1>{{ title }}</h1>
  <p>{{ related_post }}</p>
  <p>{{ __meta.related_post.author }}</p>
```

```html
<div>
  <h1>Blog Post</h1>
  <p>Other Blog Post<p>
  <p>Willy Williams</p>
</div>
```

Notice that the output of `related_post` is just the string value for that field, while
`__meta.related_post` provides access to all of the values in the related post, so we were able to
access the author via `__meta.related_post.author`.


## Preview Styles

You'll want to use your production styles rather than rewriting styles just for the preview. This is
done by registering the url to your stylesheet.

```js
CMS.registerPreviewStyle('/styles.css')
```

Multiple stylesheets can be added, and raw CSS strings can be registered as well. All registered
styles are included in the preview pane iframe.

```js
const rawStyles = `
body {
  margin: 0;
}
`

CMS.registerPreviewStyle(rawStyles)
CMS.registerPreviewStyle('https://example.com/styles.css')
CMS.registerPreviewStyle('https://unpkg.com/some-non-existent-package/styles.css')
```
