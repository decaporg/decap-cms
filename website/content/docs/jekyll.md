---
title: Jekyll
weight: 20
group: guides
---

## Introduction

This section will help you integrate Netlify CMS with a new or existing Jekyll project.

[Jekyll](https://jekyllrb.com/) is a blog-aware static site generator built with Ruby. [Github Pages](https://pages.github.com/) are powered by Jekyll, making it a popular choice for developer blogs and project pages.

If you're starting a new project, the fastest route to publishing on a Jekyll website with Netlify CMS is to [deploy a template on Netlify](https://templates.netlify.com/).

## Setup

This guide will use the blog you get if you follow the [really excellent official Jekyll step by step tutorial](https://jekyllrb.com/docs/step-by-step/01-setup/) as a starting point. If you're new to Jekyll - I recommended you start by following the tutorial so you know your way around your new blog. Otherwise [you can clone this repo](https://github.com/adamwatters/jekyll-tutorial-with-netlify-cms/tree/without-cms) and checkout the `without-cms` branch.

![Jekyll tutorial blog screenshot](https://www.netlifycms.org/img/screenshot-jekyll-tutorial-blog.png?raw=true)

## Add Netlify CMS

### Add admin/index.html

Create a file `admin/index.html` in the root of your repo - it should look like this:

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

### Add admin/config.yml

Create a file `admin/config.yml` in the root of your repo - it should look like this:

```yml
# config.yml

backend:
  name: git-gateway
  branch: master # Branch to update (optional; defaults to master)
media_folder: 'assets/uploads'
collections:
  - name: 'blog'
    label: 'Blog'
    folder: '_posts/'
    fields:
      - { name: Title }
```

### Setup Backend

Follow the directions in the docs [to enable Identity and Git Gateway](https://www.netlifycms.org/docs/add-to-your-site/#enable-identity-and-git-gateway) then add the [Identity Widget](https://www.netlifycms.org/docs/add-to-your-site/#add-the-netlify-identity-widget)

## CMS Configuration

### Blog Collection

We'll start by updating the `blog` collection. Blogging is baked into Jekyll, and the `_posts/` directory uses [some special conventions](https://jekyllrb.com/docs/posts/) we'll need to keep in mind as we configure Netlify CMS. Copy and paste the following into your `config.yml`.

```yaml
collections:
  - name: 'blog'
    label: 'Blog'
    folder: '_posts/'
    create: true
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
    editor:
      preview: false
    fields:
      - { label: 'Layout', name: 'layout', widget: 'hidden', default: 'post' }
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Publish Date', name: 'date', widget: 'datetime' }
      - { label: 'Body', name: 'body', widget: 'markdown' }
```

A few things to note.

- We set the `slug` to `'{{year}}-{{month}}-{{day}}-{{slug}}'` because [Jekyll requires this format for blog posts](https://jekyllrb.com/docs/posts/#creating-posts). `year`, `month`, and `day` will be extracted from the `date` field, and `slug` will be generated from the `title` field.
- We added `editor` configuration with a field `preview: false`. This will eliminate the preview pane. Because Jekyll uses Liquid templates, there currently isn't a good way to provide a preview of pages as you update the content.
- The `layout` field default is set to `post` so Jekyll knows to use `_layouts/post.html` when it renders a post. This field is hidden because we want all posts to use the same layout.
- The `date` and `title` field will be used by the `slug` - as noted above, Jekyll relies on the filename to determine a post's publish date, but Netlify CMS does not pull date information from the filename and requires a frontmatter `date` field. **Note** Changing the `date` or `title` fields in Netlify CMS will not update the filename. This has a few implications...
  - If you change the `date` or `title` fields in Netlify CMS, Jekyll won't notice
  - You don't neccassarily need to change the `date` and `title` fields for existing posts, but if you don't the filenames and frontmatter will disagree in a way that might be confusing
  - If you want to avoid these issues, use a regular Jekyll collection instead of the special `_posts` directory

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

then update `_layouts/author.html`, `_layouts/post.html` and `staff.html` accordingly.

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
<!-- _layouts/post.html -->
--- layout: default ---

<h1>{{ page.title }}</h1>

<p>
  {{ page.date | date_to_string }}
  {% assign author = site.authors | where: 'name', page.author | first %}
  {% if author %}
    - <a href="{{ author.url }}">{{ author.display_name }}</a>
  {% endif %}
</p>

{{ content }}
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
        - label: "Navigation Items"
          name: "items"
          widget: "list"
          fields:
            - {label: Name, name: name, widget: string}
            - {label: Link, name: link, widget: string}
```

Now you can add, rename, and rearrange the navigation items on your blog.
