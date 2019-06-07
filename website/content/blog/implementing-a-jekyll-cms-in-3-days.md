---
title: Implementing a Jekyll CMS in 3 Days
author: Shea Daniels
description: >-
  Monetery, Dwolla's annual tech summit, needed flexibility after building a new
  website. Using Netlify CMS they added content management to a Jekyll site in
  three days.
twitter_image: /img/netlify-cms.png
date: '2019-06-06'
canonical_url: https://www.dwolla.com/updates/implementing-netlify-cms/
---

*This guest post was written by Shea Daniels, Lead Software Engineer at [Dwolla](https://www.dwolla.com) and user of Netlify CMS. It was originally published on the [Dwolla blog](https://www.dwolla.com/updates/implementing-netlify-cms/).*

---
<br>

[![Screenshot of the Monetery Conference website](https://cdn.dwolla.com/com/prod/20190606103416/Screen-Shot-2019-06-06-at-10.33.31-AM.png)](https://monetery.com)

<br>

Let’s say you’re building the next great startup or putting together a spectacular event—the first question anybody asks you is “What’s the website?”

A beautiful and usable online presence is simply table stakes in 2019 for businesses, nonprofits or even prospective employees—and it was no different for [Monetery](https://monetery.com/), the inclusive tech summit Dwolla puts on each spring. We needed to get a great site up and running fast, so we initially landed on a reliable and proven solution that we’ve used before: [GitHub Pages](https://pages.github.com/).

This worked well early on as we launched the Monetery homepage, but it became clear that we needed a more complete solution. Because of our robust controls process, engineering was quickly becoming a roadblock. We needed to do a better job of enabling our content editors to move fast and make necessary changes quickly.

So we took a look at our options:
1. Implement a traditional Content Management System (CMS) like WordPress</li>
2. Find a Headless CMS to integrate into a Static Site Generator (SSG)</li>

The landscape of potential products for both of these options is monumental. We were familiar with traditional options, so we scoured [headlesscms.org](https://headlesscms.org/) and [staticgen.com](https://www.staticgen.com) to see what else was out there. Dwolla affords its engineering staff with dedicated time for professional development each week, which gave us an opportunity to test drive potential solutions.

One of the most interesting solutions we tried came from a company called [Netlify](https://www.netlify.com/), and their project [Netlify CMS](https://www.netlifycms.org/).

We thought Netlify CMS might benefit us for the following reasons:
- It’s built for use with Static Site Generators so we get to keep the speed, security and scalability benefits that drew us to SSGs in the first place
- It’s SSG agnostic, so it would work with our existing [Jekyll](https://jekyllrb.com/) site but not prevent us from changing our mind down the road (hi there, [GatsbyJS](https://www.gatsbyjs.org/)!)
- There is no database backend since content changes are stored as Git commits - which makes [InfoSec](https://www.dwolla.com/security/) folks happy
- It provides a simple and usable editor experience
- It’s open source, so there is no vendor lock-in, and we can contribute features that are important to us back to the community

With buy-in from our stakeholders, we decided to move forward. We’ll talk about the decisions we had to make and show you how to integrate Netlify CMS with Jekyll on your own site.

## Should you move from GitHub Pages to Netlify Hosting?

This was the first choice we needed to make. Switching seemed like it would add additional time and complexity to our project, and thus initially our decision was “no.” Using Netlify CMS with your existing hosting provider is a perfectly valid choice.

So why did we change our mind and move to Netlify hosting? The answer is that we found two features very compelling: [Git Gateway](https://www.netlify.com/docs/git-gateway/) and [branch deploys](https://www.netlify.com/docs/continuous-deployment/#branches-deploys).

Git Gateway works as an intermediary between the CMS and your Git repository. In concrete terms, this means you can do things like have your users log into the CMS admin with Google instead of requiring them to each have a GitHub account. Netlify then makes commits on your behalf using a GitHub account that granted access to a repo via OAuth. Although the Git Gateway is [open source](https://github.com/netlify/git-gateway) software as well, it was clear that learning to host that ourselves was going to involve a considerable learning curve.

Branch deploys give you the ability to have more than one version of your site live at a time. In comparison, GitHub Pages has a serious limitation in that only a single branch (usually master or gh-pages) can be deployed. This may not sound particularly exciting, but it enables a wonderful feature that we’ll get back to in a bit.

## Migrating from GitHub Pages to Netlify

In general, publishing your site from Netlify is as easy as creating a Netlify account, signing in to your Git provider (GitHub, GitLab or Bitbucket) and selecting a repo. As soon as you provide a build command, Netlify can start deploying your site. Tasks like setting up SSL are explained by the [Netlify Docs](https://www.netlify.com/docs/) so we won’t cover that here.

If you were using the built-in Jekyll gems and build process that GitHub provided, you’ll need a few additional things to get the build working. You’ll need a Gemfile for your dependencies, and it’s also a good idea to check your build command into source control as well:

<figure>
  <figcaption>Gemfile</figcaption>

  ```x
  source "https://rubygems.org"
  gem 'github-pages'
  ```
</figure>

<figure>
  <figcaption>netlify.toml</figcaption>

  ```x
  [build]
  publish = "_site/"
  command = "jekyll build"
  ```
</figure>

Once you’re satisfied that everything looks good and is deploying correctly from Netlify, you can proceed to claim your domain name on Netlify and migrate DNS over to Netlify’s name servers. After your DNS is fully cut over, you can safely turn off the GitHub Pages site from your repo.

## Adding Netlify CMS to an Existing Site

Netlify CMS itself consists of a [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application) built with [React](https://reactjs.org/) that lives in an admin folder on your site. For Jekyll, it goes right at the root of your project. It will contain two files:

```x
admin
 ├ index.html
 └ config.yml
```

The [Netlify CMS Docs](https://www.netlifycms.org/docs/add-to-your-site/) explain this better than we can:

> The first file, `admin/index.html`, is the entry point for the Netlify CMS admin interface. This means that users navigate to `yoursite.com/admin/` to access it. On the code side, it's a basic HTML starter page that loads the Netlify CMS JavaScript file. In this example, we pull the file from a public CDN:

<figure>
  <figcaption>admin/index.html</figcaption>

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
</figure>

> The second file, `admin/config.yml`, is the heart of your Netlify CMS installation, and a bit more complex. The [Configuration](https://www.netlifycms.org/docs/add-to-your-site/#configuration) section covers the details.

To start with, the config file might look something like this:

<figure>
  <figcaption>admin/config.yml</figcaption>

  ```yaml
  backend:
    name: git-gateway
    branch: master
    identity_url: "https://yoursite.com/.netlify/identity"
    gateway_url: "https://yoursite.com/.netlify/git"
    squash_merges: true

  publish_mode: editorial_workflow
  media_folder: "assets/img/uploads"

  site_url: https://yoursite.com
  logo_url: https://yoursite.com/assets/img/logo.svg

  collections:
  ```
</figure>

The `backend` section covers the basics like which branch to update and sets up the Git Gateway connection that we talked about earlier. The `publish_mode` property sets up our workflow to use the [editorial](https://www.netlifycms.org/docs/add-to-your-site/#editorial-workflow) mode. In short, this means that we have the ability to save page drafts as pull requests in Git before we decide to publish them. Combined with the branch deploys feature of Netlify, this is going to give us live previews of unpublished content from a static site generator!

*Note: as of May 2019, the editorial workflow is only supported when you use GitHub as a provider*

Now we just need to drop in the Netlify Identity Widget on the main site. This is needed because after a user logs in they’ll be redirected to the homepage of the site. We need to redirect them back to the CMS admin, so add the following script before the closing body tag:

```js
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

With this in place, and the appropriate authentication and Git Gateway configuration on netlify.com, you should be able to log into the Netlify CMS admin for your site at `https://yourdomain.com/admin`.

### What are Collections?

Although at this point you can log in, you can’t do much yet! There is no data structure set up for the CMS fields you’ll need to edit your site. You may have noticed the empty `collections` field in the config file, and this is where the magic happens. All fields for data that you want to save need to be part of a collection.

There are two [types of collections](https://www.netlifycms.org/docs/collection-types/), folder collections and file collections. To understand the difference, let’s figure out what Netlify CMS actually does when you make a content edit: the data has to be stored somewhere and we know that it uses Git as a back end. That means the data you save must end up inside of a file in your project. So when we configure a collection, we are telling Netlify CMS about the structure and naming convention of the files we want to create. It’s then up to your static site generator to determine how to interpret these files and pull the data into templates. In this blog post, we’ll cover how that works for Jekyll.

Knowing this, can you guess why there are two types of collections? In the case of defined options, we can tell the CMS to put that field in a specific file in our project. In the case of repeating content, like blog posts or pages built out of modular components, we want to set up Netlify CMS so that it can generate many files based on a pattern that we define. We can generate a number of different file formats too - it supports YAML, JSON, markdown with [front matter](https://jekyllrb.com/docs/front-matter/), and a few others.

### Setting Up a File Collection for Global Options

A file collection is the perfect place to define data fields for things that are valid across your entire site, such as global navigation, footers, and defaults. Let’s look at a file collection from a real config file:

<figure>
  <figcaption>admin/config.yml</figcaption>

  ```yaml
  collections:
  - label: "Sitewide Options"
    name: options
    editor:
      preview: false
    files:
      - label: "Navigation Menu"
        name: nav
        file: "_data/nav.yml"
        fields:
          - label: "Nav Items"
            label_singular: "Nav Item"
            name: topLevelItems
            widget: list
            fields:
              - {label: "Display Text", name: displayText, widget: string}
              - {label: URL, name: url, widget: string}
              - label: "Item Type"
                name: itemType
                widget: select
                options: ["Link", "Button"]
  ```
</figure>

This will define a new collection that shows up on left side of the CMS admin UI, and it will make a “Navigation Menu” page underneath that collection. Inside are fields that define some site navigation items that each include a name, URL, etc. We define the data type and editor interface of the fields using [widgets](https://www.netlifycms.org/docs/widgets/). When a change is made, it will be saved to the file located at `_data/nav.yml` in your project.

![Screenshot of a page in the Netlify CMS admin interface](https://cdn.dwolla.com/com/prod/20190529161537/Screen-Shot-2019-05-29-at-4.14.23-PM.png)

Here’s an example of what the data file might look like:

<figure>
  <figcaption>_data/nav.yml</figcaption>

  ```yaml
  topLevelItems:
  - displayText: 'A Page'
    itemType: Link
    url: /a-page/
  - displayText: 'External Link'
    itemType: Link
    url: '/https://google.com'
  ```
</figure>

### How to Use a File Collection in Jekyll

Let’s figure out how to pull this data into a template in Jekyll. Here’s a simple liquid template that uses our nav data:

```liquid
<ul>
  {% for item in site.data.nav.topLevelItems %}
    <li>
      {% if item.itemType == 'Link' %}
        <a href="{{ item.url }}">{{ item.displayText }}</a>
      {% else %}
        ...
      {% endif %}
    </li>
  {% endfor %}
</ul>
```

In Jekyll, everything in the `_data` folder is available using the `site.data.{file}.{field}` syntax. You can loop and get fields as you would expect.

### Setting Up a Folder Collection for Pages

A folder collection is used any time we need a number of files to be generated according to a pattern, but we don’t know how many. For example, if you’re building a blog, this is what you need for your posts. In this example, we’ll use it with a cool Jekyll feature to let content editors create the pages of our site on the fly and at any path they want.

Let’s look at the bones of a folder collection from a real config file to see how this works:

<figure>
  <figcaption>admin/config.yml</figcaption>

  ```yaml
  collections:
  - label: "Pages"
    label_singular: "Page"
    name: pages
    folder: "_pages"
    create: true
    slug: "{{slug}}"
    preview_path: "{{permalink}}"
    editor:
      preview: false
    fields:
      - {label: "Title", name: title, widget: string}
      - {label: "Permalink", name: permalink, widget: string}
      - label: "Layout Template"
        name: "layout"
        widget: "select"
        default: "blocks"
        options:
          - { label: "Default", value: "blocks" }
          - { label: "Home Page", value: "home" }
      - {label: "Meta Description", name: metaDescription, widget: text, required: false}
      - label: "Social Sharing"
        name: social
        widget: object
        required: false
        fields:
          - {label: "OpenGraph Image", name: ogImage, widget: image, required: false}
          - {label: "Twitter Image", name: twitterImage, widget: image, required: false}
  ```
</figure>

This defines another new collection called “Pages” that will consist of many files all stored in the `/_pages/` folder of your project. The files will be named according to the pattern in the slug field, which we’ve confusingly set to have a pattern of `{{slug}}`. Don’t worry, in this case it just means we’ll be using the default value, which is the contents of the `title` field. You can configure this in many ways to include dates and other things to match your intended use, but this is perfect for our case.

![Screenshot of the Pages collections in Netlify CMS admin](https://cdn.dwolla.com/com/prod/20190529161807/Screen-Shot-2019-05-29-at-4.17.02-PM.png)

Of special note are the `permalink` and `preview_path` fields. We’ll use the permalink field to define the path of our page in Jekyll, and the preview field shares that definition with Netlify CMS so it knows how to link to the correct page preview (branch deploys FTW).

Here’s an example of what the data file for a page might look like:

<figure>
  <figcaption>_pages/home.md</figcaption>

  ```liquid
  ---
  Title: Home
  permalink: /
  layout: home
  metaDescription: Shout out what you’re about!
  social: {}
  ---
  ```
</figure>

### How to Use a Folder Collection in Jekyll

If you were reading closely, you may have noticed that the file collection is generating YAML files, while the folder collection is generating markdown files with front matter. You might think that’s a bit odd to have a markdown file with no content below the data in the front matter (demarcated by the triple dashes), but rest assured there’s a good reason!

We’ll work in concert with Jekyll’s own [collections feature](https://jekyllrb.com/docs/collections/) to pair our markdown files with a template, read the data in the front matter and then use it to generate our page output. This lets us do neato things later like use the [variable type list widget](https://www.netlifycms.org/docs/beta-features/#list-widget-variable-types) to make a component based page builder!

Before we start, we need to make an addition to the Jekyll config file:

<figure>
  <figcaption>_config.yml</figcaption>

  ```yaml
  collections:
  pages:
    output: true
  ```
</figure>

This tells Jekyll to generate a new page for each markdown file in the `pages` folder.

But how does Jekyll know which template to use? In this case, the `layout` field we defined in Netlify CMS is doing exactly that. Jekyll maps the value in that front matter field directly to the name of a template file in the `_layouts` folder of your project.

Let’s look at an example layout template:

<figure>
  <figcaption>_layouts/home.html</figcaption>

  ```liquid
  ---
  layout: default
  ---

  <h1>{{ page.title }}</h1>

  <section class="home">
    {{ content }}
  </section>
  ```
</figure>

All of the data we are interested in from the front matter is available using the `{collection}.{field}` syntax that Jekyll provides. We’re able to use parent templates and all of the other features as you’d expect.

### Making a Page Builder in Jekyll

We’re off to a great start, but we didn’t need to go to all that trouble with our folder collection if we weren’t going to take it one step farther: let’s make a flexible, component-based page builder!

First, we need to define our components in the Netlify CMS config file:

<figure>
  <figcaption>_admin/config.yml</figcaption>

  ```yaml
  collections:
    - label: "Pages"
      ...
      - label: "Content Blocks"
        label_singular: "Content Block"
        name: blocks
        widget: list
        types:
          - label: "Hero"
            name: hero
            widget: object
            fields:
              - {label: "Heading", name: heading, widget: string}
              - {label: "Content", name: content, widget: markdown, buttons: ["bold", "italic", "link"], required: false}
          - label: "Rich Text Block"
            name: textBlock
            widget: object
            fields:
              - {label: "Heading", name: heading, widget: string, required: false}
              - {label: "Content", name: content, widget: markdown}
          ...
  ```

</figure>

Here we’ve extended our pages collection to include a variable type list widget that contains several different types of objects that the content editor will be able to dynamically add and rearrange from the CMS Admin.

![Screenshot of a page builder in Netlify CMS admin](https://cdn.dwolla.com/com/prod/20190529162003/Screen-Shot-2019-05-29-at-4.19.06-PM.png)

Now let’s make a new layout to render our widgets:

<figure>
  <figcaption>_layouts/blocks.html</figcaption>

  ```liquid
  ---
  layout: default
  ---

  {% for block in page.blocks %}
    {% include blocks/{{ block.type }}.html block=block %}
  {% endfor %}  
  ```
</figure>

Here we’re looping through each component on the page, and including another template file that knows how to render it. Here’s what a component template might look like:

<figure>
  <figcaption>_includes/blocks/hero.html</figcaption>

  ```liquid
  <header class="page-hero">
    <h1>{{ block.heading }}</h1>
    {% if block.content and block.content != '' %}
      <div class="max-width--330">
        {{ block.content | markdownify }}
      </div>
    {% endif %}
  </header>
  ```
</figure>

Because we passed along our block variable, everything is right where we need it. You’ll also notice we took special care to translate our markdown into HTML with markdownify since that isn’t being automatically done for us any more.

## Our Experience with Netlify + Netlify CMS

Using these techniques, our engineers were able to integrate Netlify CMS into our existing Jekyll site for [Monetery](https://monetery.com/) and launch a working CMS within a matter of days (three, to be exact). Content editors were able to onboard quickly and start publishing changes and new pages shortly after launch. During that time we also onboarded a new engineer who was able to start making meaningful contributions on their second day of work!


That said, [we’re never done](https://www.dwolla.com/about/core-beliefs/). We’re constantly learning from our experiences and trying to improve. Let’s take a balanced look at both the pros and cons of using Netlify + Netlify CMS:

### Pros
- Hosting on Netlify is a breeze and we haven’t experienced any issues with the site itself
- Netlify CMS was very easy to retrofit onto an existing Jekyll project and intuitive for new engineers to learn
- It’s easy and very useful to get a copy of your entire project, including content, and run it locally using docker<
- The Netlify CMS interface is simple and easy to learn for content editors
- Branch deploys and previews are amazing
- Netlify’s free plans give you the freedom to evaluate the offering before committing
- There is an active and very helpful [community](https://gitter.im/netlify/NetlifyCMS) for Netlify CMS on Gitter
- Netlify CMS is open source and welcomes contributions

### Cons
- Our content editors like the editorial workflow but don’t like the multiple steps to save and publish
- Saving and publishing is relatively slow, sometimes up to a few seconds
- We experience occasional—but frustrating—errors when using the CMS admin
- Some widgets or functionality that you might be looking for, such as conditional logic for displaying fields in the admin UI, hasn’t been implemented yet
- The CMS UI doesn’t work to save content to your machine during local development, it will always commit back to your Git repository, so be careful
- You are better off hosting with Netlify instead of another provider if you want features like branch deploys and a hosted Git Gateway - this may incur more cost to your business

## The Community &amp; Contributing Back

The Netlify CMS community has been nothing short of wonderful to interact with, so we encourage you to reach out and give this technology a try. Dwolla also believes in linking our words with our actions, so we’re committed to giving back to the open source community. We’re happy to report that our first pull request contributing to Netlify CMS is already live!


Check out the code on GitHub: https://github.com/netlify/netlify-cms
