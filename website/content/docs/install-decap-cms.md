---
group: Add
weight: 2
title: 1. Install Decap CMS
---

A static `admin` folder contains all Decap CMS files, stored at the root of your published site. Where you store this folder in the source files depends on your static site generator. Here's the static file location for a few of the most popular static site generators:

| These generators                                        | store static files in |
| ------------------------------------------------------- | --------------------- |
| Jekyll, GitBook                                         | `/` (project root)    |
| Hugo, Gatsby, Nuxt 2, Gridsome, Zola, Sapper, SvelteKit | `/static`             |
| Next, Nuxt 3, Astro                                     | `/public`             |
| Hexo, Middleman, Jigsaw                                 | `/source`             |
| Wyam                                                    | `/input`              |
| Pelican                                                 | `/content`            |
| Spike                                                   | `/views`              |
| VuePress                                                | `/.vuepress/public`   |
| Elmstatic                                               | `/_site`              |
| 11ty                                                    | `/_site`              |
| preact-cli                                              | `/src/static`         |
| Docusaurus                                              | `/static`             |
| MkDocs                                                  | `/site`               |
| Lume                                                    | `/_site`              |

If your generator isn't listed here, you can check its documentation, or as a shortcut, look in your project for a `css` or `images` folder. The contents of folders like that are usually processed as static files, so it's likely you can store your `admin` folder next to those. (When you've found the location, feel free to add it to these docs by [filing a pull request](https://github.com/decaporg/decap-cms/blob/master/CONTRIBUTING.md#pull-requests)!)

Inside the `admin` folder, you'll create two files:

```bash
admin
 ├ index.html
 └ config.yml
```

The first file, `admin/index.html`, is the entry point for the Decap CMS admin interface. This means that users navigate to `yoursite.com/admin/` to access it. On the code side, it's a basic HTML starter page that loads the Decap CMS JavaScript file.

The second file, `admin/config.yml`, is the heart of your Decap CMS installation, and a bit more complex. The [Configuration](#configuration) section covers the details.

In this example, we pull the `admin/index.html` file from a public CDN.

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>Content Manager</title>
</head>
<body>
  <!-- Include the script that builds the page and powers Decap CMS -->
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```

In the code above the `script` is loaded from the `unpkg` CDN. Should there be any issue, `jsDelivr` can be used as an alternative source. Simply set the `src` to `https://cdn.jsdelivr.net/npm/decap-cms@^3.0.0/dist/decap-cms.js`

### Installing with npm

You can also use Decap CMS as an npm module. Wherever you import Decap CMS, it automatically runs, taking over the current page. Make sure the script that imports it only runs on your CMS page.

First install the package and save it to your project:

```bash
npm install decap-cms-app --save
```

Then import it (assuming your project has tooling for imports):

```js
import CMS from 'decap-cms-app'
// Initialize the CMS object
CMS.init()
// Now the registry is available via the CMS object.
CMS.registerPreviewTemplate('my-template', MyTemplate)
```

<div class="content-bottom">
    <div class="right">
        <a href="/docs/choosing-a-backend/" class="button">2. Choosing a Backend</a>
    </div>
    <p>
        <strong>Once this is completed, proceed to step 2.</strong>
    </p>
</div>
