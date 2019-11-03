---
title: Nuxt
group: guides
weight: 20
---

This guide will walk you through how to integrate Netlify CMS with Nuxt.

## Starting With `create-nuxt-app`

Follow the instructions on the [Nuxt documentation](https://nuxtjs.org/guide/installation#using-code-create-nuxt-app-code-) for creating a new project, or run:

```bash
npx create-nuxt-app <name-of-your-new-project>
cd <name-of-your-new-project>
npm run dev
```

## Setting Up Netlify CMS

### Add the Netlify CMS files to Nuxt

In the `static/` directory, create a new directory `admin/`. Inside that directory you'll create two files, your `index.html` and a `config.yml`. Per the [Netlify CMS documentation], we'll set the content of `static/admin/index.html` to the following:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Content Manager</title>
    <!-- Include the script that enables Netlify Identity on this page. -->
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  </head>
  <body>
    <!-- Include the script that builds the page and powers Netlify CMS -->
    <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
  </body>
</html>
```

For your `static/admin/config.yml` file, you can put in a basic starter config:

```yaml
backend:
  name: git-gateway
  branch: master

media_folder: static/img
public_folder: /img

collections:
  - name: 'blog'
    label: 'Blog'
    format: 'json'
    folder: 'assets/content/blog'
    create: true
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
    editor:
      preview: false
    fields:
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Publish Date', name: 'date', widget: 'datetime' }
      - { label: 'Description', name: 'description', widget: 'string' }
      - { label: 'Body', name: 'body', widget: 'markdown' }
```

You can build whatever collections and content modeling you want. The important thing to note is the `format: 'json'` value on each collection. This is important for consuming content in Nuxt.

### Add the `content/` directory to Nuxt

In your `assets/` directory, you can create a new directory `content/`. As you might guess, this is where our content will live. Your filesystem should look about like this, so far:

```sh
root/
├ assets/
│  └ content/
├ components/
├ layouts/
├ middleware/
├ pages/
├ plugins/
├ static/
│  └ admin/
│     ├ index.html
│     └ config.yml
├ store/
└ // .editorconfig, .gitignore, nuxt.config.js, etc...
```

### Pushing to GitHub

It's now time to commit your changes and push to GitHub. `create-nuxt-app` initializes Git automatically for you, so you only need to do:

```bash
git add .
git commit -m "Initial Commit"
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u origin master
```

### Deploying With Netlify

Now you can go ahead and deploy to Netlify. Go to your Netlify dashboard and click **[New site from Git](https://app.netlify.com/start)**. Select the repo you just created. Under **Basic build settings**, you can set the build command to `yarn generate` and the publish directory to `dist`. Click **Deploy site** to get the process going.

### Authenticating with Netlify Identity

**Add the Netlify Identity Widget**

You've already added the Netlify Identity widget to our `admin/index.html`. The next thing to do is add the Netlify Identity widget to our site's index page. In `pages/index.vue`, we can add the following to the page `<script>` tag:

```js
export default {
  head() {
    return {
      script: [{ src: 'https://identity.netlify.com/v1/netlify-identity-widget.js' }],
    };
  },
};
```

Once you've added this, make sure to push your changes to GitHub!

_More on adding `<script>` tags to `<head>` [here](https://nuxtjs.org/faq/#local-settings)._

**Enable Identity & Git Gateway in Netlify**

Back in your [Netlify dashboard](https://app.netlify.com/):

1. Go to **Settings > Identity**, and select **Enable Identity service**.
2. Once enabled, select **Settings and usage**, and scroll down to **Registration preferences**. You can set this to either **Open** or **Invite only**, but usually **Invite only** is your best bet for a personal site.
3. If you don't want to create an account, or would like to use an external provider such as GitHub or Google, you can enable those services under **External providers**.
4. Scroll down to **Services** and click **Enable Git Gateway**.

**Accessing the CMS**
Once you've reached this point, you should be able to access the CMS in your browser at `http://localhost:3000/admin`. You'll be prompted to add the URL of your Netlify site. Once you've added that URL, you can log in with an Identity account or with one of the External Providers you enabled in step 3 above. For the sake of this tutorial, you can create a blog post in the CMS, and publish it! Once you `git pull` in your project, the blog post will show up in the project at `assets/content/blog/<slugified-blog-post-title>.json`.

## Integrating content in Nuxt with Vuex

Next, you'll set up the integrated Vuex store to collect blog posts. Create a file `index.js` in the `store/` directory, and add **state**, **mutations**, and **actions** for your blog posts:

```js
export const state = () => ({
  blogPosts: [],
});

export const mutations = {
  setBlogPosts(state, list) {
    state.blogPosts = list;
  },
};

export const actions = {
  async nuxtServerInit({ commit }) {
    let files = await require.context('~/assets/content/blog/', false, /\.json$/);
    let blogPosts = files.keys().map(key => {
      let res = files(key);
      res.slug = key.slice(2, -5);
      return res;
    });
    await commit('setBlogPosts', blogPosts);
  },
};
```

Now you can use that content in your templates. In your `pages/` directory, create a `blog/` directory. Within the `blog/` directory, create two files `index.vue` and `_blog.vue`. These will respectively be the blog list page and the blog post page.

**Blog List Page**

In `pages/blog/index.vue`, you'll add a method to the `computed` property of the Vue instance to return blog posts from the Vuex store. This will make `blogPosts` available in the Vue template for you to iterate over, etc.

```js
export default {
  computed: {
    blogPosts() {
      return this.$store.state.blogPosts;
    },
  },
};
```

**Blog Post Page**
Now open your `pages/blog/_blog.vue` file. Add an `asyncData()` method to the Vue instance that imports the corresponding JSON file. You can add a `payload` as well — this will come in handy during the process of running `nuxt generate` to create a static site.

```js
export default {
  async asyncData({ params, payload }) {
    if (payload) return { blogPost: payload };
    else
      return {
        blogPost: await require(`~/assets/content/blog/${params.blog}.json`),
      };
  },
};
```

Now in your template, you can access whatever properties you need.

```html
<template>
  <article>
    <h1>{{blogPost.title}}</h1>
    <div>{{blogPost.body}}</div>
  </article>
</template>
<script>
```

If you have Markdown in your content, you can use the `@nuxtjs/markdownit` module to render that.

### Rendering Markdown with `@nuxtjs/markdownit`

First, install the Nuxt `markdownit` module.

```sh
npm install @nuxtjs/markdownit
```

Next, add the module to your `nuxt.config.js` and set its configuration. For this example, you can use `markdownit`'s Vue injection.

```js
export default {
  modules: ['@nuxtjs/markdownit'],
  markdownit: {
    injected: true,
  },
};
```

Back in your `pages/blog/_blog.vue` file, you can update your template to render that Markdown.

```html
<template>
  <article>
    <h1>{{blogPost.title}}</h1>
    <div v-html="$md.render(blogPost.body)" />
  </article>
</template>
```

### Generating pages with the `generate` property

To render your site as a static site, you'll need to update the `generate` property in `nuxt.config.js` to create dynamic routes and provide their content as a `payload`. In `generate`, make your `routes` entry a function:

```js
export default {
  generate: {
    routes: function() {
      const fs = require('fs');
      return fs.readdirSync('./assets/content/blog').map(file => {
        return {
          route: `/blog/${file.slice(2, -5)}`, // Remove the .json from the end of the filename
          payload: require(`./assets/content/blog/${file}`),
        };
      });
    },
  },
};
```

Now you can generate your site with `nuxt generate`.
