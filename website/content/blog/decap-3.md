---
title: Decap 3.0 is now available
description: >-
  First release as Decap CMS is now available
date: 2023-08-23T08:00:00.000Z
author: Martin Jagodic
twitter_image: /img/decap-3.png
---
We are happy to announce that the first release of Decap CMS is now available. It is released under 3.0 to honor the 2 major versions of the Netlify CMS.

Decap on NPM: https://www.npmjs.com/package/decap-cms

## Add to your site

Via script tag in admin.html:

```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
```

or via NPM:

```bash
npm install decap-cms-app
```

## Changes

Decap 3.0 is very similar to Netlify CMS 2.10.192 (the last available version), and it's fully backward compatible. 

Notable changes are:
- Renamed project: logo, name, packages, npm, and all other references to Netlify CMS
- Updated Slate editor
- Updated Webpack
- Cypress: updated and all tests are working & passing again
- Updated Typescript
- Added Toastify notifications

## Potential issues

There was no beta phase as this is the first release, so there might be some issues that we didn't find. Please report them on GitHub.

## Thanks

Thanks to everyone in the community that waited patiently for so long. Thanks to all the contributors and other engaged users that helped us in this transition period. Thanks to Netlify for creating this amazing project and for letting us continue it.
