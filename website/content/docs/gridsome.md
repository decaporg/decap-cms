---
group: Guides
weight: 70
title: Gridsome
---
This guide will help you get started using Netlify CMS and Gridsome.

## How to install Gridsome
### 1. Install Gridsome CLI tool

```bash
# Using Yarn
yarn global add @gridsome/cli

# Using NPM
npm install --global @gridsome/cli
```

## Create a new Gridsome website

```bash
# To create a new project run
gridsome create gridsome-netlify-blog

# Then navigate to the project folder
cd gridsome-netlify-blog

# To start local dev server at http://localhost:8080
gridsome develop
```

### Install Netlify CMS the required dependencies to your project

```bash

# Using Yarn
yarn add netlify-cms gridsome-plugin-netlify-cms @gridsome/source-filesystem @gridsome/transformer-remark

# Using NPM
npm add netlify-cms gridsome-plugin-netlify-cms @gridsome/source-filesystem @gridsome/transformer-remark
```

Now that the plugins are installed, it's time to setup the configuration. Open the `gridsome.config.js` file and update its content to:

```js
module.exports = {
  siteName: 'Gridsome',
  transformers: {
    remark: {
      externalLinksTarget: '_blank',
      externalLinksRel: ['nofollow', 'noopener', 'noreferrer'],
      anchorClassName: 'icon icon-link'
    }
  },

  plugins: [
    {
      use: '@gridsome/source-filesystem',
      options: {
        path: 'posts/**/*.md',
        typeName: 'Post'
      }
    },
    {
      use: `gridsome-plugin-netlify-cms`,
      options: {
        publicPath: `/admin`
      }
    },
  ]
}
```

Please read [gridsome-plugin-netlify-cms](https://gridsome.org/plugins/gridsome-plugin-netlify-cms), [transformer-remark](https://gridsome.org/plugins/@gridsome/transformer-remark) for more information.

## Netlify CMS setup

1. Create an `admin` directory inside the `src`
2. Create an `uploads` directory inside the root of your project
3. Add `index.html`, `index.js` and a `config.yml` file to your `admin` directory

Your `index.html` should look like this:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Netlify CMS</title>
  </head>
  <body>
    <script src="index.js" type="module"></script>
  </body>
</html>
```

Your `index.js` should look like this:

```js
import CMS from "netlify-cms"
```

Your `config.yml` for GitHub should look like this:

```yml
backend:
  name: git-gateway
  branch: master

media_folder: "static/uploads"
public_folder: "/uploads"

collections:
  - name: "posts"
    label: "Posts"
    folder: "posts"
    create: true
    slug: "{{slug}}"
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Excerpt", name: "excerpt", widget: "string"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Body", name: "body", widget: "markdown"}
```

## Push to GitHub

It's now time to commit your changes and push to GitHub.

```bash
git init
git add .
git commit -m "Initial Commit"
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u origin master
```

### Add your repo to Netlify

Go to Netlify and select 'New Site from Git'. Select GitHub and the repository you just pushed to. Click Configure Netlify on GitHub and give access to your repository. Finish the setup by clicking Deploy Site. Netlify will begin reading your repository and starting building your project.

### Enable Identity and Git Gateway

Netlify's Identity and Git Gateway services allow you to manage CMS admin users for your site without requiring them to have an account with your Git host or commit access on your repo. From your site dashboard on Netlify:

1. Go to **Settings > Identity**, and select **Enable Identity service**.
2. Under **Registration preferences**, select **Open** or **Invite only**. In most cases, you want only invited users to access your CMS, but if you're just experimenting, you can leave it open for convenience.
3. If you'd like to allow one-click login with services like Google and GitHub, check the boxes next to the services you'd like to use, under **External providers**.
4. Scroll down to **Services > Git Gateway**, and click **Enable Git Gateway**. This authenticates with your Git host and generates an API access token. In this case, we're leaving the **Roles** field blank, which means any logged in user may access the CMS. For information on changing this, check the [Netlify Identity documentation](https://www.netlify.com/docs/identity/).


## Start publishing

It's time to create your first blog post. Login to your site's `/admin/` page and create a new post by clicking New Blog. Add a title, a date and some text. When you click Publish, a new commit will be created in your GitHub repo with this format `Create Blog “year-month-date-title”`. 

Then Netlify will detect that there was a commit in your repo, and will start rebuilding your project. When your project is deployed you'll be able to see the post you created.

Your basic blog scaffold is done, now you can query data from the GraphQL server just like you're working with the filesystem. For more info read [querying data](https://gridsome.org/docs/querying-data).
