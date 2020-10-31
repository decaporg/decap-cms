---
group: Guides
weight: 70
title: Gridsome
---
This guide will help you get started using Netlify CMS and Gridsome.

## How to install Gridsome
### 1. Install Gridsome CLI tool

``` javascript

// Using Yarn
yarn global add @gridsome/cli

// Using NPM
npm install --global @gridsome/cli
```

## Create a new Gridsome website

``` javascript
// To create a new project run
gridsome create gridsome-netlify-blog

// Then open folder
cd gridsome-netlify-blog

// To start local dev server at `http://localhost:8080
gridsome develop
```

### Install Netlify CMS the required dependencies to your project

``` javascript

// Using Yarn
yarn add netlify-cms gridsome-plugin-netlify-cms @gridsome/source-filesystem @gridsome/transformer-remark

// Using NPM
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

```javascript
git init
git add .
git commit -m "Initial Commit"
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u origin master
```

## Add your repo to Netlify

Go to Netlify and select 'New Site from Git'. Select GitHub and the repository you just pushed to. Click Configure Netlify on GitHub and give access to your repository. Finish the setup by clicking Deploy Site. Netlify will begin reading your repository and starting building your project.

## Netlify CMS authentication with GitHub

Before we can start adding posts we'll have to give Netlify access to our GitHub, this part is **crucial**, please follow the steps closely. More info can be read [here](https://www.netlify.com/docs/authentication-providers/);

Part 1, GitHub:

1. Open [this](https://github.com/settings/developers) link
2. Click on "New OAuth App"
3. Fill in all the fields according to your website and use `https://api.netlify.com/auth/done` as `authorization` callback URL

Part 2, Netlify:

1. Go to your Netlify dashboard and click on your project
2. Navigate to Settings > Access control > OAuth
3. Under Authentication Providers, click Install Provider
4. Select GitHub and enter the Client ID and Client Secret, then save ([0Auth Docs - How do I find my GitHub client ID and secret?](https://auth0.com/docs/connections/social/github#3-get-your-github-app-s-client-id-and-client-secret))


## Start publishing

It's time to create your first blog post. Login to your site's `/admin/` page and create a new post by clicking New Blog. Add a title, a date and some text. When you click Publish, a new commit will be created in your GitHub repo with this format `Create Blog “year-month-date-title”`. 

Then Netlify will detect that there was a commit in your repo, and will start rebuilding your project. When your project is deployed you'll be able to see the post you created.

Your basic blog scaffold is done, now you can query data from the GraphQL server just like you're working with the filesystem. For more info read [querying data](https://gridsome.org/docs/querying-data).