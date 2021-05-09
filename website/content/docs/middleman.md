---
title: Middleman
group: Guides
weight: 60
---
This guide will help you get started using Netlify CMS and Middleman.

## Installation
To get up and running with Middleman, you need both the Ruby language runtime and RubyGems installed on your computer. Check out the [Middleman installation docs](https://middlemanapp.com/basics/install/) for more details. If you already have your environment set up, use the following command to install Middleman:

```bash
gem install middleman
```

## Create a new Middleman site
Let's create a new site from scratch. Run the following commands in the terminal, in the folder where you'd like to create the blog:

```bash
middleman init blog
cd blog
```

### Add the Middleman blog extension
Middleman has an official extension to support blogging, articles and tagging. `middleman-blog` ships as an extension and must be installed to use. Simply specify the gem in your Gemfile:

```bash
gem "middleman-blog"
```
Install the dependencies and run Middleman with the following commands:

```bash
bundle install
middleman server
```

## Get started with Middleman

Now we have our site up and running let's open up a code editor and create a new folder `source/posts` and add your first article named `2019-01-01-example-article.html.md` with the following content:


```yml
---
title: Example Article
date: 2019-01-01
---

This is an example article. You probably want to delete it and write your own articles once you finished this guide!
```

### Activate the blog extension
We can then activate the blog in `config.rb`. Be sure to check out the [Middleman blogging docs](https://middlemanapp.com/basics/blogging/) for all the configuration options.

```bash
activate :blog do | blog |
  blog.permalink = "blog/{title}.html"
  blog.sources = "posts/{year}-{month}-{day}-{title}.html"
  blog.layout = "blog-layout"
end
```

### Load the articles
Time to load our articles in `index.html.erb`.

```ruby
<h1>Recent articles</h1>

<% blog.articles.each do | article | %>
  <article>
    <h2>
      <%= article.title %>
    </h2>

    <%= link_to 'Read more', article %>
  </article>

<% end %>
```

### Add an article layout
In the last step before we add Netlify CMS, we add a layout for the article page. Create a new layout `source/layouts/blog-layout.html.erb`. For now we will get the title and the content:
```ruby
<h1>
  <%= current_page.data.title %>
</h1>

<%= yield %>
```

Now that we have a functioning blog, let's get started with Netlify CMS!

## Add Netlify CMS to your site

Create two files in a new folder called `admin`, `index.html` and `config.yml`. Also add an `upload` folder in the images directory that will function as our `media_folder`.
```bash
├── source
│   ├── admin
│   │   ├── index.html
│   │   ├── config.yml
│   │
│   ├── images
│   │   ├── uploads
```


In the newly created `index.html` we add scripts for Netlify CMS and the Netlify Identity Widget:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Netlify CMS</title>
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js" type="text/javascript"></script>
  </head>
  <body>
    <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js" type="text/javascript"></script>
  </body>
</html>

```

### Configuration

For the purpose of this guide we will deploy to Netlify from a GitHub repository which requires the minimum configuration. In `config.yml` file paste the following code:

```yml
backend:
  name: git-gateway
  branch: main # Branch to update (optional; defaults to master)

media_folder: source/images/uploads
public_folder: /images/uploads

collections:
  - name: blog
    label: Blog
    folder: source/posts/
    extension: .html.md
    format: frontmatter
    create: true
    slug: '{{year}}-{{month}}-{{day}}-{{title}}'
    fields:
      - {label: Title, name: title, widget: string}
      - {label: Publish Date, name: date, widget: datetime}
      - {label: Body, name: body, widget: markdown}
```

### Push to GitHub
It's now time to commit your changes and push to GitHub. 

```bash
git init
git add .
git commit -m "Initial Commit"
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u origin main
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

Be sure to checkout the official [Middleman Starter](https://github.com/tomrutgers/middleman-starter-netlify-cms) for more examples.
