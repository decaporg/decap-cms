---
title: Using Netlify CMS with NextJS
weight: 35
group: guides
---

This guide will help you get started using Netlify CMS with NextJS.

## Create a new NextJS site
Let's repeat some of the basics of setting up a simple NextJS project (check out [http://nextjs.org/learn](nextjs.org/learn) for a more detailed version).

```bash
# Create new directory and navigate into it
mkdir awesome-kitties
cd awesome-kitties

# Initialize a new project
npm init -y

# Install required dependencies
npm install --save react react-dom next

# Intall webpack loader for Markdown
npm install --save-dev frontmatter-markdown-loader

# Create folder for pages (default for NextJS), and add a index file
mkdir pages
touch pages/index.js

# Create a folder for content, and a markdown file:
mkdir content
touch content/home.md
```

Up next we need to add some modifications to our ``package.json`` file to make it easier to run and deploy our new site:

```json
{
  "scripts": {
    "dev": "next",
    "build": "next build",
    "start": "next start",
    "export": "npm run build && next export"
  }
}
```

There is a lot of different ways to create and display Markdown content, but to make this as easy as possible we'll be using a webpack-loader that enables us to load markdown files directly in our React components (frontmatter-markdown-loader). 
Add the following content to your ```content/home.md``` file:

```md
---
title: Awesome kitties
date: 2019-03-17T19:31:20.591Z
cats:
  - description: 'Maru is a Scottish Fold from Japan, and he loves boxes.'
    name: Maru (まる)
  - description: Lil Bub is an American celebrity cat known for her unique appearance.
    name: Lil Bub
  - description: 'Grumpy cat is an American celebrity cat known for her grumpy appearance. '
    name: Grumpy cat (Tardar Sauce)
---
Welcome to my awesome page about cats of the internet. 

This page is built with NextJS, and content is managed in Netlify CMS

```

Now we need to tell webpack how to load Markdown files. Create a new ```next.config.js``` at the root of the project with the following content:

```js
module.exports = {
    webpack: (cfg) => {
        cfg.module.rules.push(
            {
                test: /\.md$/,
                use: 'frontmatter-markdown-loader'
            }
        )
        return cfg;
    }
}
```

Almost there! The last thing we need to do is to add some content our ```pages/index.js``` file. With a little help of our webpack loader, we can now easilly import Markdown files:

```js
import React, { Component } from 'react'
import content from '../content/home.md';

export default class Home extends Component {
  render() {
    let { html , attributes:{ title, cats } } = content;
    return (
      <article>
          <h1>{title}</h1>
          <div dangerouslySetInnerHTML={{ __html: html }}/>
          <ul>
              { cats.map((cat, k) => (
                  <li key={k}>
                    <h2>{cat.name}</h2>
                    <p>{cat.description}</p>
                  </li>
              ))}
          </ul>
      </article>
    )
  }
}

```

Awesome! We are now done with the content part - and you should hopefully be able to see your new page by starting the development server:
```bash
npm run dev
```



## Adding Netlify CMS
There are multiple ways to hook up Netlify CMS. The easiest is by far to just embed it. To do this, we'll create a new admin directory inside the ```/static``` folder. In theory, you could create a "post build" script that moves this folder to the root of your site - but we won't cover that in this guide.

```bash
# Create and navigate into static/admin folder
mkdir -p static/admin
cd static/admin

# Create index.html and config.yml file
touch index.html
touch config.yml
```

Paste HTML for Netlify into your ``index.html`` file (check out the Quick Start guide for more information)

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
  <!-- Include the script that builds the page and powers Netlify CMS -->
  <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
</body>
</html>
```



Paste this configuration into ```config.yaml```:

```yaml
backend:
  name: git-gateway
  branch: master
media_folder: static/img
collections:
  - name: "pages"
    label: "Pages"
    files:
    - label: "Home"
      name: "home"
      file: "content/home.md"
      fields: 
        - { label: "Title", name: "title", widget: "string"}
        - { label: "Publish Date", name: "date", widget: "datetime" }
        - { label: "Body", name: "body", widget: "markdown"}
        - label: 'Cats'
          name: "cats"
          widget: list
          fields: 
            - { label: "Name", name: "name", widget: "string"}
            - { label: "Description", name: "description", widget: "text"}
```

Awesome! Everything should in theory be working now, but in order to actually view and edit the content with Netlify CMS, we need to add our page to a git repository and create a new Netlify site. 

**Tip:** If you want to test changes made to your config.yaml file locally, swap out "git-gateway" with "test-repo" and navigate to ```localhost:3000/static/admin/index.html``` to view Netlify CMS locally (you can't make changes or read actual content from Git this way, but it's great to verify how things will look).

## Adding to Git and creating a Netlify site
To make everything super-easy we'll create a new project at GitHub and create a Netlify site from there. 
Create a new repository and follow the instructions on how to push existing files into a new respository.
Now is probably also a good time to add a ```.gitignore``` file:

```
.next/
node_modules/
/npm-debug.log
.DS_Store
out/
```


When your project is under version control, go to Netlify and select "New Site from Git". Select GitHub, and the repository you just pushed to.

### Enable Identity and Git Gateway

Netlify's Identity and Git Gateway services allow you to manage CMS admin users for your site without requiring them to have an account with your Git host or commit access on your repo. From your site dashboard on Netlify:

1. Go to **Settings > Identity**, and select **Enable Identity service**.
2. Under **Registration preferences**, select **Open** or **Invite only**. In most cases, you want only invited users to access your CMS, but if you're just experimenting, you can leave it open for convenience.
3. If you'd like to allow one-click login with services like Google and GitHub, check the boxes next to the services you'd like to use, under **External providers**.
4. Scroll down to **Services > Git Gateway**, and click **Enable Git Gateway**. This authenticates with your Git host and generates an API access token. In this case, we're leaving the **Roles** field blank, which means any logged in user may access the CMS. For information on changing this, check the [Netlify Identity documentation](https://www.netlify.com/docs/identity/).


Open your new Netlify site, and navigate to ```/static/admin```. Sign up for an account (or use GitHub), and login to Netlify CMS. Congratulations - you can now manage your cat list! 
