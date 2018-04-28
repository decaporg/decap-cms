---
title: Creating a Preview Template Compiler
position: 40
menu:
  docs:
    parent: guides
---

# Creating a Preview Template Compiler

A preview template compiler is a function that receives a template and the current entry data from the
editor, and returns an HTML string for use in the editor preview pane. Different compilers support
different templating languages. Netlify CMS comes bundled with a Handlebars template compiler, but
what if you'd rather use [EJS](http://ejs.co/) templates? We'll walk through creation of an EJS
preview template compiler for this guide.

## Finding and using a parsing library

Preview template compilers usually don't do much on their own, instead serving as adapters for
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

Your preview template compiler will receive four arguments when called:

- `name` {string} - identifier for the template compiler
- `template` {any} - the template itself, which is often a string, but could be anything
- `data` {object} - the current entry data
- `config` {object} - a configuration object that may differ depending on the template compiler

Most template parsing libraries provide a `compile` or `render` function that accepts a string
template and a data object, and returns an HTML string, which is very close to what Netlify CMS
preview template compilers do. The `ejs` package works this way, providing both a `compile` and a
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
