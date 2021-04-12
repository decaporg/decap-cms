# Backend Test

This is `in-memory` file manager.

## Has `Backend` and `AuthenticationPage`.

`AuthenticationPage` is component which allow skip `login screen` for demo purposes.

`Backend` is domain-specific file manager based on simple JS objects:

```js
window.repoFiles // json file-system three
window.repoFilesUnpublished // flat file list
```

Look at tests or types for more info.

## What `domain-specific file manager` mean?

Look at [lib-util](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) for interface description.
