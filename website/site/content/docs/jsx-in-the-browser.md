---
title: JSX in the Browser
weight: 100
menu:
  docs:
    parent: start
---

# JSX in the Browser

Because Netlify CMS uses React, and React is most often used with [JSX](#), customizing the CMS
generally involves a build system to transform the JSX into JavaScript. If you prefer to write JSX
(say for custom widgets or preview templates) without using a build system, you can do so using
[babel-standalone](https://github.com/babel/babel/tree/master/packages/babel-standalone):

```html
  <script src="https://unpkg.com/react@16/umd/react.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel">
    const PreviewTemplate = () => <h1>Totally works.</h1>
  </script>
```

Note the use of `react.development.js` - this is ideal during development for useful error messages.
When you're ready for production, use `react.production.js`.
