---
title: Hugo
group: guides
weight: 20
---
## Introduction

This guide will walk you through how to integrate Netlify CMS with Hugo. This is a good place to start if you want to learn from the ground up how these two tools work together. If you want to get up-and-running quicker, you can use one of the pre-existing and amazing [starter templates](/docs/start-with-a-template/)!

## Getting started with Hugo

### Installation

To get started with Hugo, you should first install the command line tool. If you've already got it installed, you can [skip this step](#creating-a-new-site). On MacOS and Linux you can do this with:

```bash
brew install hugo
```

To test that it's successfully installed, you can try this command, to get a list of Hugo's options:

```bash
hugo help
```

### Creating a new site

Create a new Hugo project and start it up using the following commands.

```bash
hugo new site <name-of-your-new-project>
cd <name-of-your-new-project>
hugo server
```

You won't actually see anything, just yet, and that's because you don't have any template files. That's easily resolved. In the `layouts/` directory, create a file `index.html` and put a basic HTML structure in there:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Document</title>
  </head>
  <body>
    <h1>Nice. It's looking good already.</h1>
  </body>
</html>
```

You'll also add some files to the `content/` and `data/` directories to make sure git tracks them.

```bash
touch content/.keep data/.keep
```

This is as basic as you can get with a Hugo project. There's just enough here now for us to install Netlify CMS.

## Getting Started With Netlify CMS

### Add the Netlify CMS files to Hugo

In Hugo, static files that don't need to be processed by the build commands live in the `static/` directory. You'll install the Netlify CMS admin and config files there. Create a directory `admin/` and within it, create two files `index.html` and `config.yml`. In the `index.html`, add the following content:

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

In the `config.yml` file, you can add this basic configuration — you can customize as you see fit, this sample file is just to get you started.

```yaml
backend:
  name: git-gateway
  branch: master # Branch to update (optional; defaults to master)
media_folder: static/img
public_folder: /img
collections:
  - name: 'blog'
    label: 'Blog'
    folder: 'content/blog'
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

**Note:** You won't be able to access the CMS just yet — you still need to deploy the project with **Netlify** and authenticate with **Netlify Identity**. You'll handle this in the next few steps of this guide.

### Pushing to GitHub

It's now time to commit your changes and push to GitHub. You can run the following commands to initialize a git repository and push the changes so far.

```bash
git init # Initialize a git repository
git add . # Add every file
git commit -m "Initial Commit" # Commit every file with the message 'Initial Commit'
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git # Create a new repo on GitHub and add it to this project as a remote repository.
git push -u origin master # Push your changes
```

### Deploying With Netlify

Now you can go ahead and deploy to Netlify. Go to your Netlify dashboard and click **[New site from Git](https://app.netlify.com/start)**. Select the repo you just created. Under **Basic build settings**, you can set the build command to `hugo` and the publish directory to `public`. Click **Deploy site** to get the process going.

### Authenticating with Netlify Identity

**Add the Netlify Identity Widget**

You've already added the Netlify Identity widget to our `admin/index.html`. The next thing to do is add the Netlify Identity widget to our site's index page. In `layouts/index.html`, we can add the following to the `<head>` tag on the page:

```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

Once you've added this, make sure to push your changes to GitHub!

### Enable Identity & Git Gateway in Netlify

Back in your [Netlify dashboard](https://app.netlify.com/):

1. Go to **Settings > Identity**, and select **Enable Identity service**.
2. Once enabled, select **Settings and usage**, and scroll down to **Registration preferences**. You can set this to either **Open** or **Invite only**, but usually **Invite only** is your best bet for a personal site.
3. If you don't want to create an account, or would like to use an external provider such as GitHub or Google, you can enable those services under **External providers**.
4. Scroll down to **Services** and click **Enable Git Gateway**.

### Accessing the CMS

Once you've reached this point, you should be able to access the CMS in your browser at `http://localhost:1313/admin`. You'll be prompted to add the URL of your Netlify site. Once you've added that URL, you can log in with an Identity account or with one of the External Providers you enabled in step 3 above. For the sake of this tutorial, you can create a blog post in the CMS, and publish it! Once you `git pull` in your project, the blog post will show up in the project at `content/blog/<slugified-blog-post-title>.md`.

And that's it! From this point on, it's just a matter of following [the Hugo documentation](https://gohugo.io/templates/) for outputting the content from your `content/` directory into templates! For more information on configuring Netlify CMS, feel free to check out the [Netlify CMS configuration options documentation](/docs/configuration-options/).

## Using Netlify CMS content in Hugo

### Creating a list of posts

In your `layouts/index.html` file, you'll create an unordered list element and use a Hugo `range` to output all posts. Inside that range, you can add a list item element with each post title and a link to the post inside it.

**Note:** To learn more about Hugo's `range` function, check out [the Hugo documentation](https://gohugo.io/functions/range).

```html
<body>
  <h1>Nice. It's looking good already.</h1>
  <ul>
    {{ range (where .Pages "Section" "blog") }}
    <li>
      <a href="{{ .RelPermalink }}">
        {{ .Title }}
      </a>
    </li>
    {{ end }}
  </ul>
</body>
```

That link won't work just right just yet. You'll need to make a single page layout for blog posts, so Hugo can create a page for the `.RelPermalink` to link to.

### Creating a single page post layout

Create a file `layouts/blog/single.html`, and put the following content in there:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>{{ .Title }}</title>
  </head>
  <body>
    <h1>{{ .Title }}</h1>
    <p class="date">{{ .Date }}</p>
    <p class="description">{{ .Params.description }}</p>
    <article class="content">
      {{ .Content }}
    </article>
  </body>
</html>
```

You can see this basic template includes all the fields you've specified in your Netlify CMS `config.yml` file. You can access any custom front-matter fields with `.Params.<field-name>`!

### Using Hugo shortcodes in the Markdown Editor

Using `registerEditorComponent` we can register a block level component for the Markdown editor. You can use it to add Hugo's inbuilt shortcodes like `gist`,`youtube` and others as block components to the markdown editor.

You can refer to [registering editor components](https://www.netlifycms.org/docs/custom-widgets/#registereditorcomponent) for a getting started guide or for creating your own editor components.

**Example**

```javascript
CMS.registerEditorComponent({
    id: "gist",
    label: "Gist",
    fields: [{
            name: "username",
            label: "Github Username",
            widget: "string"
        },
        {
            name: "gid",
            label: "Gist ID",
            widget: "string"
        },
    ],
    pattern: /{{< gist ([a-zA-Z0-9]+) ([a-zA-Z0-9]+) >}}/,
    fromBlock: function(match) {
        return {
            username: match[1],
            gid: match[2],
        };
    },
    toBlock: function(obj) {
        return `{{< gist ${obj.username} ${obj.gid} >}}`;
    },
    toPreview: function(obj) {
        return `{{< gist ${obj.username} ${obj.gid} >}}`;
    },
});
```

**Result**

![Gist](/img/hugo_shortcode_gist.png "Gist")

For getting started quickly you can refer to this amazing prebuilt resource of [hugo shortcodes editor components](https://github.com/sharadcodes/hugo-shortcodes-netlify-cms)!