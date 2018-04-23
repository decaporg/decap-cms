---
title: API
position: 140
---

# Previews

The preview pane shows changes to a document in realtime, as they occur, but the output is mostly
unstyled by default. For Netlify CMS to show previews that look like the actual website being
edited, you'll need to provide a template and styling. Three methods are available for this:

* **[registerPreviewTemplateCompiler()](#registerpreviewtemplatecompiler)**
* **[registerPreviewTemplate()](#registerpreviewtemplate)**
* **[registerPreviewStyle()](#registerpreviewstyle)**


## registerPreviewTemplateCompiler()

```js
CMS.registerPreviewTemplateCompiler(
  name,
  compiler,
)
```

Registers a template compiler using a name of your choice. The compiler is used to transform the
editor document into an HTML preview using a registered template. Template compilers can be written
to parse different kinds of templates, like Handlebars, EJS, golang, anything that can be parsed
with JavaScript.

Learn how to write a template compiler in [Writing a Template Compiler]().


## registerPreviewTemplate()

```js
CMS.registerPreviewTemplate(
  name,
  template,
  [config],
  [compiler],
);
```

Registers a preview template. `name` is the string used to apply the template to a collection in the
CMS configuration, `template` can be any type (typically string or function), `config` is an object
for configuring your template, and `compiler` is a string indicating the template compiler to be
used. The template compiler determines the acceptable type for `template` as well as the shape of
`config`.

Learn how to create templates in [Creating Preview Templates]().


## registerPreviewStyle()

```js
CMS.registerPreviewStyle(
  file,
);
```

Register a custom stylesheet to use on the preview pane. `file` can either be a URL to a CSS file or
a CSS string.
