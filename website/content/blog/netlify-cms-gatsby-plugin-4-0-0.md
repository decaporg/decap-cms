---
title: React Hooks support in Netlify CMS (and the Gatsby plugin)
author: Tony Alves
description: >-
  Netlify CMS 2.9.0 allows React Hooks to be used in custom Netlify CMS previews and widgets, and `gatsby-plugin-netlify-cms` 4.0.0 extends that support to Gatsby projects.
date: 2019-07-23T00:00:10.000Z
---

Netlify CMS is an extensible app written in, and bundled with, React. The most common extension is the custom preview template, which allows the preview on the right side of the editor to show what the site will actually look like as you type. These preview templates are also written in React.

Preview templates and other extensions can only use the Netlify CMS bundled copy of React via the `createClass()` method that Netlify CMS exports. Since React components are most often written in JSX and transpiled through a build system, most developers won't want to use this method, so the preview templates are created with a separate copy of React.

**This means that Netlify CMS has two instances of React running at once.**

But everything still worked - until React Hooks was released.

## The problem: React Hooks
Before [Hooks](https://reactjs.org/docs/hooks-intro), multiple instances of React _could_ work on the same DOM, although it was warned against and technically not supported. React Hooks [changed this](https://reactjs.org/warnings/invalid-hook-call-warning#duplicate-react) by throwing an error if multiple instances are detected. When developers started using hooks in their Netlify CMS previews and widgets, their applications stopped working 😭

## The solution: `netlify-cms-app`
In the past, the `netlify-cms` npm package was the only way to run Netlify CMS - it's a "batteries included" distribution that runs as-is, bringing along React and a number of default extensions (widgets, backends, etc).

As of Netlify CMS 2.9.0, a new `netlify-cms-app` package is provided as a slimmed down alternative to `netlify-cms`. It still includes most default extensions, but excludes some of the heavier ones, like media libraries for external providers.

Most importantly, **it does not include `react` or `react-dom`**, requiring them instead as [peer dependencies](https://nodejs.org/es/blog/npm/peer-dependencies/). This allows Netlify CMS and any extensions to all use a single instance of React and React DOM. As a bonus, the `netlify-cms-app` bundle is a bit smaller than `netlify-cms`.

## How to use it
**If you're building your site with Gatsby, skip this section.** For all others, you'll want to:

1. Uninstall `netlify-cms` if you're already using it
2. Install `netlify-cms-app`
3. Install `react` and `react-dom`
4. Optionally install and register media libraries (see below).

```bash
npm uninstall netlify-cms
npm install netlify-cms-app react react-dom
```

That's it! Now Netlify CMS will use the version of React that you provide.

## The Gatsby plugin
Gatsby provides transpiling and bundling with Babel and Webpack, and accepts plugins to support various JavaScript dialects, e.g., TypeScript. If a developer sets up their Gatsby site to be written a certain way, they'll want any CMS customization code to be written the same way. The problem is that Netlify CMS is a standalone app that would typically live in Gatsby's `static` directory, and Gatsby doesn't really have a way to handle a secondary entry point for the CMS for outputting a dedicated bundle.

For this reason, we support an official Gatsby plugin, [`gatsby-plugin-netlify-cms`](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-netlify-cms), which bundles preview templates and other Netlify CMS extensions using the same Babel and Webpack configuration as the Gatsby site itself.

## Using React Hooks with Netlify CMS and Gatsby
The recent 4.0.0 release of `gatsby-plugin-netlify-cms` is the first to use `netlify-cms-app` and enable the use of React Hooks in Netlify CMS previews/widgets for Gatsby projects.

If you want to start a new site now, or would like to see an example, check out [`gatsby-starter-netlify-cms`](https://github.com/netlify-templates/gatsby-starter-netlify-cms#gatsby--netlify-cms-starter) - it provides a great starting point and implements all of the remaining steps in this post.

You can deploy it to Netlify right now with one click!

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/gatsby-starter-netlify-cms&stack=cms)

### Upgrading an existing project
If you're already using `gatsby-plugin-netlify-cms`, you'll want to:
1. Upgrade to 4.0.0 or newer
2. Remove the `netlify-cms` dependency
3. Add `netlify-cms-app`

```bash
npm upgrade gatsby-plugin-netlify-cms@^4.0.0
npm uninstall netlify-cms
npm install --save netlify-cms-app
```

Note that you'll already have React and React DOM installed in your Gatsby project, so no need to do that here.

### Adding to a new project
If you're **not** already using `gatsby-plugin-netlify-cms` with your Gatsby project, you can install it and `netlify-cms-app` via npm (or your package manager of choice):

```bash
npm install --save netlify-cms-app gatsby-plugin-netlify-cms
```

You'll also need to register the plugin in `gatsby-config.js` in the site root. Create that file if it’s not already there, and add the following to register the Netlify CMS plugin:

```javascript
// gatsby-config.js

module.exports = {
  plugins: [`gatsby-plugin-netlify-cms`],
}
```

The plugin will create the Netlify CMS app and output it to `/admin/index.html` on your site. The CMS will look for your configuration to be in the same directory on your live site, at `/admin/config.yml`, so you’ll want to place the configuration file in the `static` directory of your repo at `static/admin/config.yml`. You can also [configure Netlify CMS with JavaScript](https://www.netlifycms.org/docs/beta-features/#manual-initialization). Read more about configuring the CMS in our docs, or check out the Gatsby / Netlify CMS integration guides in both our docs and theirs.

- [Netlify CMS Configuration Guide](https://www.netlifycms.org/docs/add-to-your-site/#configuration)
- [Netlify CMS Integration Guide for Gatsby Sites](https://www.netlifycms.org/docs/gatsby/)
- [Gatsby Guide - Sourcing from Netlify CMS](https://www.gatsbyjs.org/docs/sourcing-from-netlify-cms/)

## Using Media Libraries with `netlify-cms-app`
The Netlify CMS media library extensions for Cloudinary and Uploadcare are not included in `netlify-cms-app`. If you're using `netlify-cms-app`, you'll need to register media libraries yourself.

**Note:** if you're using `gatsby-starter-netlify-cms`, the media libraries are registered within the starter itself.

```javascript
import CMS from 'netlify-cms-app'

// You only need to import the media library that you'll use. We register both
// here for example purposes.
import uploadcare from 'netlify-cms-media-library-uploadcare'
import cloudinary from 'netlify-cms-media-library-cloudinary'

CMS.registerMediaLibrary('uploadcare', uploadcare)
CMS.registerMediaLibrary('cloudinary', cloudinary)
```

For more information about the media libraries, refer to the docs.

- [Using Cloudinary with Netlify CMS](https://www.netlifycms.org/docs/cloudinary/)
- [Using Uploadcare with Netlify CMS](https://www.netlifycms.org/docs/uploadcare/)

### With `gatsby-plugin-netlify-cms@^4.0.0`
In addition to calling `registerMediaLibrary()` as mentioned above, make sure to provide the path to your CMS customization entry point to Gatsby via `gatsby-config.js`:

```javascript
// gatsby-config.js

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

If you run into a problem or need help, [open an issue on GitHub](https://github.com/netlify/netlify-cms/issues/new/choose) or [chat with our community](https://netlifycms.org/chat)!
