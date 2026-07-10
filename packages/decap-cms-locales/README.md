# Decap CMS Locales

## Default translations for Decap CMS

The English translation is loaded by default.

To register another locale you can use the following code:

```js
import CMS from 'decap-cms-app';
import { de } from 'decap-cms-locales';

CMS.registerLocale('de', de);
```

> When importing `decap-cms` all locales are registered by default.

Make sure the specific locale exists in the package - unless we will happily accept a pull request for it.

The configured locale will be merge into the English one so don’t worry about missing some phrases.
