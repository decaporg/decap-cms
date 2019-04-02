---
title: Jekyll
weight: 20
group: guides
---

## Introduction

This section will help you integrate Netlify CMS with a new or existing Jekyll project.

[Jekyll](https://jekyllrb.com/) is a blog-aware static site generator built with Ruby. [Github Pages](https://pages.github.com/) are powered by Jekyll, making it a popular choice for developer blogs and project pages.

If you're starting a new project, the fastest route to publishing on a Jekyll website with Netlify CMS is to [deploy a template on Netlify](https://templates.netlify.com/).

This guide aims to be helpful for users in the following situations.

- You have an existing Jekyll project and you want to add Netlify CMS
- You have a Jekyll project with Netlify CMS integrated and want to make updates beyond adding content
- You are starting a new Jekyll + Netlify CMS project and you want to start from scratch so you know how everything fits togeter

## Setup

### Create a Jekyll Site

This guide will use the blog you get if you follow the [really excellent official Jekyll step by step tutorial](https://jekyllrb.com/docs/step-by-step/01-setup/) as a starting point. If you're new to Jekyll - I recommended you start by following the tutorial so you know your way around your new blog. Otherwise [you can clone this repo](https://github.com/adamwatters/jekyll-tutorial-with-netlify-cms/tree/without-cms) and checkout the `without-cms` branch.

![Jekyll tutorial blog screenshot](https://www.netlifycms.org/img/screenshot-jekyll-tutorial-blog?raw=true)

### Hosting and Serving

You have lots of options for hosting and serving your project, but to for the sake of simplicity this guide will assume you [follow this guide](https://www.netlify.com/blog/2015/10/28/a-step-by-step-guide-jekyll-3.0-on-netlify/) to create a remote git repository on Github and give Netlify access to build and serve the project when you push changes.

### Why Not Stop Here?

At this point you have a perfectly good Jekyll site published on the web. To update the content on your site you just open your favorite text editor, create or edit a markdown file, then commit your changes and push them to your remote git repository. But maybe you are tired of looking at markdown, or you find yourself wanting to update your blog from computers without your favorite text editor and tools installed, or you want to make it easier for less technical individuals to contribute to your blog. This is where Netlify CMS comes in.

## Add Netlify CMS

### Add admin/index.html

Create a directory called `admin` in the root directory of your Jekyll project. Jekyll will copy this directory to the `_site` generated when the `jekyll build` command is run.

```
mkdir admin
```

Move into the admin directory and create the file `index.html`

```
cd admin && touch index.html
```

Copy the following HTML into `index.html`.

```html
<!-- admin/index.html -->
<!DOCTYPE html>
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

Run `jekyll serve` and open `http://127.0.0.1:4000/admin` in your browser. You should see a page with following error message.

```
Error loading the CMS configuration
Config Errors:
Error: Failed to load config.yml (404)
Check your config.yml file.
```

### Add config.yml

As indicated in the error message, Netlify CMS requires a configuration file called `config.yml` at the root of the `admin` directory. Let's add it now.

```
touch config.yml
```

Go back to your browser and you should see a new set of errors.

```yml
Error loading the CMS configuration
Config Errors:
config should have required property 'backend'
config should have required property 'collections'
config should have required property 'media_folder'
config should have required property 'media_library'
config should match some schema in anyOf
Check your config.yml file.
```

This is good - we're making progress. Before we really dig into the configuration for our project, we'll set the minimum configuration to satisfy Netlify CMS.

- For the `backend` property we'll use the [test-repo backend](https://www.netlifycms.org/docs/authentication-backends#test-repo-backend). It will let us see the cms interface without connecting to a git repository.
- The `media_folder` property should be set to the path where you want the cms to save images. We'll follow the advice of the [jekyll docs](https://jekyllrb.com/docs/posts/#including-images-and-resources) and create an `assets/` directory. Setting the `media_folder` property will take care of the `media_library` property error as well.
- The `collections` property requires an array of collection objects. We'll start with a collection with only the property `name` defined to see what else is required.

Copy and paste the following into `config.yml`

```yml
# config.yml

backend:
  name: test-repo
media_folder: 'assets/'
collections:
  - name: 'blog'
```

Back in the browser you should see new errors related to the collection we just defined.

```
Error loading the CMS configuration
Config Errors:
'collections[0]' should have required property 'label'
'collections[0]' should have required property 'files'
'collections[0]' should have required property 'folder'
'collections[0]' should have required property 'fields'
'collections[0]' should match exactly one schema in oneOf
Check your config.yml file.
```

Netlify CMS is telling us we need to define some properties of on the collection.

- The `label` property is the string used to identify the collection in the cms UI. We'll set it to `"Blog"`
- `folder` should be set to the directory containing the files we want the cms to be able to create and edit. We'll start with `"_posts/"`
- The `fields` property requires an array of field objects. We'll start with a collection with only the property `name` defined. Setting the `fields` property will take care of the `files` property error as well.

With these update, `config.yml` should look like this.

```yml
# config.yml

backend:
  name: test-repo
media_folder: 'assets/uploads'
collections:
  - name: 'blog'
    label: 'Blog'
    folder: '_posts/'
    fields:
      - { name: Title }
```

Back in the browser you should see.

![Netlify CMS signup screenshot](https://www.netlifycms.org/img/screenshot-test-repo-login.png?raw=true)

Log in and you should see.

![empty blog collection screenshot](https://www.netlifycms.org/img/screenshot-empty-blog-collection.png?raw=true)

Awesome, the CMS is running without errors! Great, but you might have noticed the CMS isn't displaying data from the three markdown files in the `_posts/` directory. The reason is `test-repo` uses local browser storage and doesn't have access to your file system. In fact, none of the Netlify CMS backends can interact with local git repositories. This is a common point of confusion and bears repeating: NETLIFY CMS CANNOT INTERACT WITH LOCAL GIT REPOSITORIES.

Next, we'll setup the Backend and Authentication so you can start updating content on your Jekyll site.

### Backend and Authentication

You have [lots of options](https://www.netlifycms.org/docs/authentication-backends/) for giving Netlify CMS permission to push commits to the git repository for your Jekyll project. In this guide - we're using Netlify's Identity service.

Replace the `test-repo` backend configuration `git-gateway`

```yml
//
# config.yml
backend:
  name: git-gateway
  branch: master # Branch to update (optional; defaults to master)
```

In your browser, go to `https://app.netlify.com/sites/{YOUR_PROJECT_NAME}/settings/identity`

Click `Enable Identity`

Scroll down to the **Registration** section and add external OAuth providers (_optional_)

Scroll down to the **Services** section and click `Enable Git Gateway`

Add the `netlify-identity-widget.js` script to the head of `admin/index.html` and `_layouts/default.html`

```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

Add the following redirect script to the bottom of the body in `_layouts/default.html`

```html
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/";
        });
      }
    });
  }
</script>
```

[You can read more about the purpose of these changes here](https://www.netlifycms.org/docs/add-to-your-site/#add-the-netlify-identity-widget)

Now in the browser you should see a modal asking for the URL of your Netlify site.

![Add Netlify URL modal screenshot](https://www.netlifycms.org/img/screenshot-netlify-identity-site-url.png?raw=true)

Once you've set it you should see a Signup/Login modal.

![Netlify Identity modal screenshot](https://www.netlifycms.org/img/screenshot-netlify-identity-signup-login.png?raw=true)

And once you've logged in you should see the CMS UI, now populated with the Jekyll blog posts you created in the Jekyll tutorial. Also note, when using the `git-gateway` backend you'll be redirected to your live site when you login, meaning if you want to test your changes you'll need to push to your remote repository.

![populated blog collection screenshot](https://www.netlifycms.org/img/screenshot-jekyll-blog-posts.png?raw=true)

Click on one of the posts and you'll see the edit view.

![edit blog post screenshot](https://www.netlifycms.org/img/screenshot-jekyll-blog-post.png?raw=true)

Amazing! But the editor is missing some of the frontmatter fields in your markdown file, specifically the layout and author fields.

```yml
layout: post
author: jill
title: Bananas
```

Also, we still can't create new blog posts from the CMS. We'll address these issues and others in the next section.

## CMS Configuration

### Blog Collection

We'll start by updating the `blog` collection. Blogging is baked into into Jekyll, and the `_posts/` directory uses [some special conventions](https://jekyllrb.com/docs/posts/) we'll need to keep in mind as we configure Netlify CMS. Copy and paste the following into your `config.yml`.

```yaml
collections:
  - name: 'blog'
    label: 'Blog'
    folder: '_posts/'
    create: true # Allow users to create new documents in this collection
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}' # Filename template, e.g., YYYY-MM-DD-title.md
    editor:
      preview: false # Do not show the preview pane when editing items in this collection
    fields: # The fields for each document, usually in front matter
      - { label: 'Layout', name: 'layout', widget: 'hidden', default: 'post' }
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Publish Date', name: 'date', widget: 'datetime' }
      - { label: 'Body', name: 'body', widget: 'markdown' }
```

A few things to note.

- With `create: true` set you'll be able to create new posts
- We set the `slug` to `'{{year}}-{{month}}-{{day}}-{{slug}}'` because [Jekyll requires this format for blog posts](https://jekyllrb.com/docs/posts/#creating-posts). `year`, `month`, and `day` will be extracted from the `date` field, and `slug` will be generated from the `title` field.
- We added `editor` configuration with a field `preview: false`. This will eliminate the preview pane. Because Jekyll uses Liquid templates, there currently isn't a good way to provide a preview of pages as you update the content.
- The `layout` field default is set to `post` so Jekyll knows to use `_layouts/post.html` when it renders a post. This field is hidden because we want all posts to use the same layout.
- The `date` and `title` field will be used by the `slug` - as noted above, Jekyll relies on the filename to determine a post's publish date, but Netlify CMS does not pull date information from the filename and requires a frontmatter `date` field. **Note** Changing the `date` or `title` fields in Netlify CMS will not update the filename. This has a few implications...
  - If you change the `date` or `title` fields in Netlify CMS, Jekyll won't notice
  - You don't neccassarily need to change the `date` and `title` fields for existing posts, but if you don't the filenames and frontmatter will disagree in a way that might be confusing
  - If you want to avoid these issues, use a regular Jekyll collection instead of the special `_posts` directory

![Edit blog post screenshot](https://www.netlifycms.org/img/screenshot-jekyll-blog-post-complete.png?raw=true)

### Author Collection

In addition to `_posts`, the Jekyll tutorial blog includes a collection of authors in the `_authors` directory. Before we can configure Netlify CMS to work with the `authors` collection, we'll need to make a couple tweeks to our Jekyll blog. Here's the front matter for one of the authors.

```yaml
short_name: jill
name: Jill Smith
position: Chief Editor
```

`name` has special meaning as a unique identifier in Netlify CMS, but as set up now our Jekyll blog is using `short_name` as the unique identifier for authors. For each author, update the frontmatter like so.

```yaml
name: jill
display_name: Jill Smith
position: Chief Editor
```

then update `_layouts/author.html` and `staff.html` accordingly.

```html
<!-- _layouts/author.html -->
--- layout: default ---

<h1>{{ page.display_name }}</h1>
<h2>{{ page.position }}</h2>

{{ content }}

<h2>Posts</h2>
<ul>
  {% assign filtered_posts = site.posts | where: 'author', page.name %} {% for
  post in filtered_posts %}
  <li>
    <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
  </li>
  {% endfor %}
</ul>
```

```html
<!-- staff.html -->
--- layout: default ---

<h1>Staff</h1>

<ul>
  {% for author in site.authors %}
  <li>
    <h2>
      <a href="{{ site.baseurl }}{{ author.url }}">{{ author.display_name }}</a>
    </h2>
    <h3>{{ author.position }}</h3>
    <p>{{ author.content | markdownify }}</p>
  </li>
  {% endfor %}
</ul>
```

Next, copy and paste the following into the collections array in `config.yml` below the `blog` collection.

```yaml
- name: 'authors'
  label: 'Authors'
  folder: '_authors/'
  create: true
  editor:
    preview: false
  fields:
    - { label: 'Layout', name: 'layout', widget: 'hidden', default: 'author' }
    - { label: 'Short Name', name: 'name', widget: 'string' }
    - { label: 'Diplay Name', name: 'display_name', widget: 'string' }
    - { label: 'Position', name: 'position', widget: 'string' }
    - { label: 'Body', name: 'body', widget: 'markdown' }
```

Now that we have the `authors` collection configured, we can add an `author` field to the `blog` collection. We'll use the [relation widget](https://www.netlifycms.org/docs/widgets/#relation) to define the relationship between blog posts and authors.

```yaml
# updated fields in blog collection configuration
fields:
  - { label: 'Layout', name: 'layout', widget: 'hidden', default: 'post' }
  - { label: 'Title', name: 'title', widget: 'string' }
  - { label: 'Publish Date', name: 'date', widget: 'datetime' }
  - {
      label: 'Author',
      name: 'author',
      widget: 'relation',
      collection: 'authors',
      displayFields: [display_name],
      searchFields: [display_name],
      valueField: 'name',
    }
  - { label: 'Body', name: 'body', widget: 'markdown' }
```

With that configuration added, you should be able to select the author for a post from a dropdown.

![empty blog collection screenshot](https://www.netlifycms.org/img/screenshot-jekyll-author-dropdown=true)

### About Page

Our Jekyll blog includes an About page. It would nice to be able to edit that page just like we can edit our blog and author pages. Netlify CMS provides [file collections](https://www.netlifycms.org/docs/collection-types/#file-collections) to solve this problem.

Copy and paste the following into the collections array in `config.yml`

```yaml
- name: 'pages'
  label: 'Pages'
  editor:
    preview: false
  files:
    - label: 'About Page'
      name: 'about'
      file: 'about.md'
      fields:
        - { label: 'Title', name: 'title', widget: 'hidden', default: 'about' }
        - { label: 'Layout', name: 'title', widget: 'hidden', default: 'about' }
        - { label: 'Body', name: 'body', widget: 'markdown' }
```

### Navigation

The last aspect of our Jekyll blog we might want to bring under the control of Netlify CMS is our Navigation menu. Our Jekyll tutorial blog has a file `_data/navigation.yml` that defines the links rendered by `_includes/navigation.yml`. It looks like this.

```yaml
# _data/navigation.yml
- name: Home
  link: /
- name: About
  link: /about.html
- name: Blog
  link: /blog.html
- name: Staff
  link: /staff.html
```

To make this file editable with Netlify CMS, we'll need to make one minor tweak. The issue is this file contains a yaml array at the top level, but Netlify CMS is designed to work with yaml objects. Update `_data/navigation.yml` so it looks like so.

```yaml
# _data/navigation.yml
items:
  - name: Home
    link: /
  - name: About
    link: /about.html
  - name: Blog
    link: /blog.html
  - name: Staff
    link: /staff.html
```

You'll need to update `_includes/navigation.html` accordingly. `{% for item in site.data.navigation %}` should be changed to `{% for item in site.data.navigation.items %}`. When you're done, the nav html should look like this.

```html
<nav>
  {% for item in site.data.navigation.items %}
    <a href="{{ site.baseurl }}{{ item.link }}" {% if page.url == item.link %}style="color: red;"{% endif %}>
      {{ item.name }}
    </a>
  {% endfor %}
</nav>
```

Finally, add the following to the collections array in `config.yml`

```yaml
- name: "config"
  label: "Config"
  editor:
    preview: false
  files:
    - label: "Navigation"
      name: "navigation"
      file: "_data/navigation.yml"
      fields:
        - {
            label: "Navigation Items",
            name: "items",
            widget: "list",
            fields:
              - {label: Name, name: name, widget: string}
              - {label: Link, name: link, widget: string}
          }
```

Now you can add, rename, and rearrange the navigation items on your blog.

### Wrap up

In this tutorial, we added Netlify CMS to a standard Jekyll blog. We configured Netlify CMS to connect with Github and commit updates to the yaml and markdown files that define the content of the blog. Now adding and editing content to your blog should be as simple as visiting the `/admin` path and filling in some fields, all without having to worry about servers and databases. Happy blogging!
