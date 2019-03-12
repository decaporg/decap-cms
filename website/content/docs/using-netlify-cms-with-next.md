---
title: Using Netlify CMS with NextJS
weight: 35
group: guides
---

This guide will help you get started using Netlify CMS with NextJS.

## Create a new NextJS site
Let's repeat some of the basics of setting up a dead simple NextJS project (check out [http://nextjs.org/learn](nextjs.org/learn) for a more detailed version).

```
# Create new directory and navigate into it
mkdir awesome-project
cd awesome-project

# Initialize a new project
npm init -y

# Install required dependencies
npm install --save react react-dom next

# Create folder for pages
mkdir pages
```

Up next we need to add some modifications to our ``package.json`` to make it easier to build and run our application: 

```
{
  "scripts": {
    "dev": "next",
    "build": "next build",
    "start": "next start",
    "export": "npm run build && next export"
  }
}
```

Great! You can now (hopefully) start your new project with the following command:

```
npm run dev 
```

## Adding Netlify CMS
There are multiple ways to hook up Netlify CMS. The easiest is by far to just embed it. To do this, we'll create a new admin directory inside the ```/static``` folder. In theory, you could create a "post build" script that moves this folder to the root of your site - but we won't cover that in this guide.

```
# Create and navigate into static folder
mkdir static
cd static

# Create a new admin folder and navigate into it
mkdir admin
cd admin

# Create index.html and config.yml file
touch index.html
touch config.yml
```

Paste HTML for Netlify into your ``index.html`` file.

```
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
</head>
<body>
  <!-- Include the script that builds the page and powers Netlify CMS -->
  <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
</body>
</html>
```
