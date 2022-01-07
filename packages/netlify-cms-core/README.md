# Docs coming soon!

Netlify CMS was recently converted from a single npm package to a "monorepo" of over 20 packages.
That's over 20 Readme's! We haven't created one for this package yet, but we will soon.

In the meantime, you can:

1. Check out the [main readme](https://github.com/netlify/netlify-cms/#readme) or the [documentation
   site](https://www.netlifycms.org) for more info.
2. Reach out to the [community chat](https://netlifycms.org/chat/) if you need help.
3. Help out and [write the readme yourself](https://github.com/netlify/netlify-cms/edit/master/packages/netlify-cms-core/README.md)!

## Config Schema Validation

This package uses [AJV](http://ajv.js.org) to validate user's configuration files. There are two versions of this validation mechanism - static and dynamic. Dynamic validation is triggered when the configuration file includes custom validation schema for custom widgets. Static validation is used when the configuration does not have custom validation schema. Dynamic validation does not work in environments where Content Security Policy does not allow `unsafe-eval`. Due to this constraint, custom validation for custom widgets does not work where `unsafe-eval` is disallowed. You can learn more about this in [CMS does not work with Content Security Policy (CSP). Requires unsafe-eval / unsafe-inline for script-src / style-src](https://github.com/netlify/netlify-cms/issues/2138) issue. 

### Modifying Static Config Schema validation

Static schema validation is stored in [./src/constants/staticValidateConfig.js](./src/constants/staticValidateConfig.js). It is generated using `yarn write-validate-schema` script which intern uses `ajv` CLI to compile schema stored in [./config.schema.json](./config.schema.json) to JavaScript that can be executed the browsers without triggering Content Security Policy where `unsafe-eval` is disallowed. This script relies on [./validation-rules/instanceof.js](./validation-rules/instanceof.js) and [./validation-rules/uniqueItemProperties.js](./validation-rules/uniqueItemProperties.js) these validation rules describe how AJV should generate source code for `instanceof` and `uniqueItemProperties` keywords. They are necessary because `ajv-keywords@5.0.0` which is used by this package does not support code generation yet - see notes in [instanceof](https://github.com/ajv-validator/ajv-keywords#instanceof) and [uniqueItemProperties](https://github.com/ajv-validator/ajv-keywords#uniqueitemproperties). These two files can be removed when `ajv-keywords` adds support for code generation for thes keywords.

**Note**: If you modify [./config.schema.json](./config.schema.json) then you should run `yarn write-validate-schema` to regenerate the [./src/constants/staticValidateConfig.js](./src/constants/staticValidateConfig.js) file. 