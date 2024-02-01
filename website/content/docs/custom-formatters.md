---
title: Custom formatters
weight: 60
group: Customization
---

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
