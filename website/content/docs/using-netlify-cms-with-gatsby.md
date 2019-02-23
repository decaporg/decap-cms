# Using Netlify CMS with Gatsby

This guide will help you get started using Netlify CMS and Gatsby.

## Create a new Gatsby site

Let's start by importing the default Gatsby Starter Blog.

```sh
npx gatsby new blog https://github.com/gatsbyjs/gatsby-starter-blog
```

## Get to know Gatsby

In your favorite code editor, open up the code generated for your "Gatsby Starter Blog" site, and take a look at the `content` directory.

```sh
cd blog
code .      # If you are using Visual Studio Code
```

You will see that there are multiple `markdown` files that represent blog posts. Open one `.md` file and you will see something like this:

```yml
---
title: Hello World
date: "2015-05-01T22:12:03.284Z"
---
This is my first post on my new fake blog! How exciting!

I'm sure I'll write a lot more interesting things in the future.
```

We can see above that each blog post has a title, a date and a body. Now, let's recreate this using Netlify CMS. 
_Note that properties that live between the 3 dotted lines (`---`) are called Front Matter._

## Integrate Netlify CMS to your site

First let's install some dependencies. We'll need `netlify-cms` and `gatsby-plugin-netlify-cms`.

```sh
yarn add netlify-cms gatsby-plugin-netlify-cms
```

### Configuration

For the purpose of this guide we will deploy to Netlify from a GitHub repository which requires the minimum configuration.

Create a `config.yml` file in the directory structure you see below:

```sh
├── static
│   ├── admin
│   │   ├── config.yml
```

In your `config.yml` file paste the following configuration:

```yml
backend:
  name: git-gateway
  branch: master

media_folder: static/img
public_folder: /img

collections:
  - name: "blog"
    label: "Blog"
    folder: "content/blog"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Publish Date", name: "date", widget: "datetime" }
      - { label: "Body", name: "body", widget: "markdown" }
```

### Add Netlify CMS

Create the directory structure you see below:

```sh
├── src
│   ├── cms
│   │   ├── cms.js
│   │   ├── preview-templates
│   │   │   ├── BlogPostPreview.js
```

We will use this file to import Netlify CMS and register preview templates.

In the `cms.js` file paste the following code:

```jsx
import CMS from "netlify-cms";

import BlogPostPreview from "./preview-templates/BlogPostPreview";

CMS.registerPreviewTemplate("blog", BlogPostPreview);
```

In the `BlogPostPreview.js` file paste the following code:

```jsx
import React from "react";
import PropTypes from "prop-types";
import BlogPostTemplate from "../../templates/blog-post";

const BlogPostPreview = ({ entry, widgetFor }) => (
  <BlogPostTemplate
    content={widgetFor("body")}
    date={entry.getIn(["data", "date"])}
    title={entry.getIn(["data", "title"])}
  />
);

BlogPostPreview.propTypes = {
  entry: PropTypes.shape({
    getIn: PropTypes.func
  }),
  widgetFor: PropTypes.func
};

export default BlogPostPreview;
```

Then add the plugin to your `gatsby-config.js`.

```javascript
plugins: [
  {
    resolve: `gatsby-plugin-netlify-cms`,
    options: {
      modulePath: `${__dirname}/src/cms/cms.js`
    }
  }
];
```

### Push to GitHub

It's now time to commit your changes and push to GitHub. The Gatsby starter initializes Git automatically for you, so you only need to do:

```bash
git add .
git commit -m "Initial Commit"
git remote add origin git@github.com:user/repo.git
git push -u origin master
```

### Add your repo to Netlify

Go to Netlify and select 'New Site from Git'. Select GitHub and the repository you just pushed to. Click Configure Netlify on GitHub and give access to your repository. Finish the setup by clicking Deploy Site. Netlify will begin reading your repository and starting building your project.

### Enable Netlify Identity and Git Gateway

In Netlify go to Identity and Enable Identity. Then under Identity > Services, click Enable Git Gateway. Click Generate access token in GitHub. Then, go to `/admin/` to create an account, either by email, or by setting an external OAuth provider.

## Start publishing

It's time to create your first blog post. Login to your site's `/admin/` page and create a new post by clicking New Blog. Add a title, a date and some text. When you click Publish, a new commit will be created in your GitHub repo with this format `Create Blog “year-month-date-title”`. 

Then Netlify will detect that there was a commit in your repo, and will start rebuilding your project. When your project is deployed you'll be able to see the post you created.

### Cleanup

It is now safe to remove the default Gatsby blog posts. _(We didn't delete them before, because we needed at least 1 post for our project to build)_
