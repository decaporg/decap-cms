---
title: Netlify CMS and Gatsby major release (4.0.0)
author: Tony Alves
description: >-
  Netlify CMS 2.9.x and the Gatsy plugin 4.x is out with support for React Hooks, and
  more!
twitter_image: /img/gatsby-netlify-cms.png
date: 2019-05-03T00:00:10.000Z
---

Netlify CMS released `netlify-cms-app` at version 2.9.x

Gatsby released `gatsby-plugin-netlify-cms` 4.0.0 plugin today!

![Netlify CMS and Gatsby together and better](/img/netlify-cms-gatsby.png)

## What this means for you

Once Netlify CMS version 2.9.0 landed, you could now extend Netlify CMS with React as a peer dependency. This gives you the ability to use the new features of React and React hooks. Now with the Netlify CMS Gatsby plugin version 4.0.0 you can take advantage of hooks in your shared previews in your project.

Here are a couple of advantages of these new releases together:

* Using React hooks is no longer an issue in previews
* Smaller build bundle of the CMS in your Gatsby build

## How to setup in a project

```bash
yarn add netlify-cms-app gatsby-plugin-netlify-cms
```

or 

```bash
npm install --save netlify-cms-app gatsby-plugin-netlify-cms
```

Add the Gatsby plugin to the `gatsby-config.js` in the site root. Create that file if it’s not already there, and add the following to register the Netlify CMS plugin:

`gatsby-config.js`
```javascript
module.exports = {
  plugins: [`gatsby-plugin-netlify-cms`],
}
```

The plugin will create the Netlify CMS app and outputting it to “/admin/index.html”, so you’ll want to put the configuration file in that same directory (`static/admin/config.yml`). You can read about [creating the configuration in the docs][1].

The [Netlify CMS Gatsby starter][2] has an example of a setup with a Gatsby project (see below).

The Gatsby docs have an entry on [how to also setup Netlify CMS][3] in a Gatsby project.

### Media Libraries (if not using starter) using `gatsby-plugin-netlify-cms@^4.0.0`

Media Libraries have been excluded from the `netlify-cms-app` module library. If you are planning to use `Uploadcare` or `Cloudinary` in your project, you **can** add them in `src/cms/cms.js`. Here is an example of the files to add to your project.

`gatsby-config.js`
```javascript
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-plugin-netlify-cms',
      options: {
        modulePath: `${__dirname}/src/cms/cms.js`,
      },
    },
  ]
}
```

**For Cloudinary**

`src/cms/cms.js`
```javascript
import CMS from 'netlify-cms-app'
import cloudinary from 'netlify-cms-media-library-cloudinary'

CMS.registerMediaLibrary(cloudinary);
```

**For Uploadcare**

`src/cms/cms.js`
```javascript
import CMS from 'netlify-cms-app'
import uploadcare from 'netlify-cms-media-library-uploadcare'

CMS.registerMediaLibrary(uploadcare);
```

## Try out the Netlify CMS Gatsby starter

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/gatsby-starter-netlify-cms&stack=cms)

## Upgrading from v3.x of `gatsby-plugin-netlify-cms` to v4.x

* Upgrade to `gatsby-plugin-netlify-cms@latest`
* Remove `netlify-cms` from the project
* Add `netlify-cms-app@latest` to the project
* Change any imports of `netlify-cms` to `netlify-cms-app`
* If you are using Cloudinary or Uploadcare, see above
* Use React Hooks 😁 in your previews

[1]: https://www.netlifycms.org/docs/add-to-your-site/#configuration
[2]: https://github.com/netlify-templates/gatsby-starter-netlify-cms&stack=cms
[3]: https://www.gatsbyjs.org/docs/sourcing-from-netlify-cms/
