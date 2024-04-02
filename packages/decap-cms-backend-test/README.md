# Test backend

The backend behind https://demo.decapcms.org/.
Used for demo purposes only.

## Code structure

`Implementation` for [File Management System API](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-util/README.md) based on simple JS objects:

```js
window.repoFiles // json file-system tree
window.repoFilesUnpublished // flat file list
```

`AuthenticationPage` - A component which allow skip `login screen` for demo purposes.

Look at tests or types for more info.
