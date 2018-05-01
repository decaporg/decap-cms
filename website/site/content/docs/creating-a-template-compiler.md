---
title: Creating a Template Compiler
position: 40
menu:
  docs:
    parent: guides
---

# Creating a Template Compiler

A template compiler is a function that receives a template and the current entry data from the
editor, and returns an HTML string for use in the editor preview pane. Different compilers support
different templating languages. Netlify CMS comes bundled with a Handlebars template compiler, but
what if you'd rather use [EJS](http://ejs.co/) templates? We'll walk through creation of an EJS
template compiler for this guide.

## Using a library

Template compilers usually don't do much on their own, instead serving as adapters for
template parsing libraries. When creating a compiler to support a templating language, your first stop
should be npm, where you'll search for the best JavaScript compiler available for your templating
language.

A quick search for "ejs" on the [npm website](https://www.npmjs.com/search?q=ejs) reveals the
official JavaScript library for parsing EJS templates, the unsurprisingly named
[ejs](https://www.npmjs.com/package/ejs) package.

Let's add the ejs package to our project:

```bash
npm install ejs
```

Your template compiler will receive four arguments when called:

- `name` {string} - identifier for the template compiler
- `template` {any} - the template itself, which is often a string, but could be anything
- `data` {object} - the current entry data
- `config` {object} - a configuration object that may differ depending on the template compiler

Most template parsing libraries provide a `compile` or `render` function that accepts a string
template and a data object, and returns an HTML string, which is very close to what Netlify CMS
template compilers do. The `ejs` package works this way, providing both a `compile` and a
`render` method. The `render` method is the most straightforward, so we'll create our own `compile`
function using that:

```js
function renderEJS(collectionName, template, data) {
  return ejs.render(template, data)
}
```

With just those three lines, we have a function that can be registered as a preview template
compiler!

## Registering the compiler

The last step for our basic EJS compiler is registering it to be used in the CMS:

```js
CMS.registerTemplateCompiler('ejs', renderEJS)
```

If this is the only registered compiler, it will be used automatically for all preview templates.
Otherwise, you can set the compiler for a collection in your CMS config file:

```yaml
collections:
  - name: post
    label: Post
    templateCompiler: ejs
```

## Improving performance

The template compiler will run on every change in the editor, so we want to do as little as possible
when that happens to avoid hurting performance. Most template libraries provide a function to
prepare the template for processing beforehand, so that rendering HTML only requires adding data to
the prepared template.

The `ejs` package has a `compile` method for this purpose - let's run it when our template compiler
loads and cache the result for reuse:

```js
// Our "cache" is just an object. The keys will be collection names, and the
// values will be compiled templates.
const templateCache = {}

function renderEJS(collectionName, template, data) {

  // add the compiled template cache if it isn't already there
  templateCache[collectionName] = templateCache[collectionName] || ejs.compile(template)

  // grab the cached compiled template
  const compiledTemplate = templateCache[collectionName]

  // return the rendered HTML
  return compiledTemplate(data)

}
```

## Transforming templates and data

Sometimes the editor data or the template will need to be tweaked to achieve the desired preview
output. Template compilers should support this by accepting `transformData` and `transformTemplate`
functions in the `config` object.

Let's update our compiler to support template and data transformation functions:

```js
const templateCache = {}

function renderEJS(collectionName, template, data, config) {

  const { transformTemplate, transformData } = config

  // if no cached template, run the raw template through the transform function
  // and the ejs compile function
  if (!templateCache[collectionName]) {
    const transformedTemplate = transformTemplate ? transformTemplate(template) : template
    templateCache[collectionName] = ejs.compile(transformedTemplate)
  }

  const compiledTemplate = templateCache[collectionName]

  // run the data through `transformData`, this happens every time the compiler is called
  const transformedData = transformData(data)

  return compiledTemplate(transformedData)
}
```

## Example usage

With the EJS compiler we've just created, here's what usage might look like:

```js
import CMS from 'netlify-cms'
import blogTemplate from './src/templates/blog.ejs'

// This import represents the compiler we just created
import ejsCompiler from 'netlify-cms-template-compiler-ejs'

const blogTemplateConfig = {

  // Using the `transformTemplate` function to remove scripts from templates
  transformTemplate: template => template.replace(/<script ?.*>(.|\s)*<\/script>/g, ''),

  // Using the `transformData` function to add placeholder values that a
  // static site generator might provide in a production build
  transformData: data => { ...data, site: {
    tags: ['jamstack', 'static', 'ci'],
  }},

}

CMS.registerTemplateCompiler('ejs', ejsCompiler)
CMS.registerPreviewTemplate('blog', blogTemplate, blogTemplateConfig, 'ejs')
```
