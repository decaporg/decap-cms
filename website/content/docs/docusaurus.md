---
group: Guides
weight: 80
title: Docusaurus
---
This guide instructs you on how to integrate Netlify CMS with Docusaurus.

### Before you begin

* Sign up for [GitHub](www.github.com) and [Netlify](www.netlify.com).
* Download [Node.js](https://nodejs.org/en/download/) version 14 or above.
* Install the [GitHub CLI](https://cli.github.com/).
* Install and authenticate the [Netlify CLI](https://docs.netlify.com/cli/get-started/).

## Create a new Docusaurus project

```bash
# 1. Use Docusaurus to create a site scaffold.
npx create-docusaurus@latest my-website classic

# 2. Run the development server.
cd my-website
npm run start
```

A browser window opens at `http://localhost:3000`. 

The development server now serves your website at `http://localhost:3000`. As you edit the source files in `/my-website/`, you can visit `http://localhost:3000` to preview your changes.

</li>

</ol>

## Push your project to GitHub

Netlify CMS requires a [backend](https://www.netlifycms.org/docs/backends-overview/) to store content. Netlify CMS supports using Git hosts, like GitHub or GitLab, as backends. This guide uses GitHub. 

```bash
# 1. Initialize your local Git repository.  
git init

# 2. Rename your initial branch to match GitHub.
git branch -m main

# 3. Stage all your local files to your repository.
git add . 

# 4. Commit your staged changes.
git commit -m 'Initial commit'

# 5. Create a remote repository on GitHub using the GitHub CLI.
gh repo create my-website
```

Don't add a license or a .gitignore. Do add an "origin" git remote.

![](/img/screen-shot-2021-11-15-at-4.16.53-pm.png)

```bash
# 6. Update your remote repository with your staged changes. 
git push -u origin main
```

## Publish your project using Netlify CLI

<ol>
<li> Connect Netlify CLI to your GitHub repository.

```bash
netlify init
```

</li>
<li> Choose <code>Create & configure a new site</code>. </li>
<li> Choose your team and site name. </li>
<li> Choose <code>yarn build</code> for your build command. </li>
<li> Choose <code>build</code> for your deployment directory. </li>
</ol>

![](/img/screen-shot-2021-11-16-at-1.34.18-PM.png)

Choose the default option for everything else. 

Your website is now deployed. Netlify provides you with a randomly generated domain name. Run `netlify open --site` to view your deployed site.

## Add Netlify CMS to your project

### Before you begin

<ol>

<li> Remove all existing posts from <code>/blog</code>.

```bash 
rm -rf ./blog/*
```

</li>

<li> Create a new blog post post titled <code>2021-11-15-first-blog-post.md</code>.

```bash
touch ./blog/2021-11-15-first-blog-post.md
```

</li>

<li> Edit <code>2021-11-15-first-blog-post.md</code> to look like this:

```yaml
---
title: First Blog Post
slug: first-blog-post
tags:
  - foo
  - bar
authors:
  - name: Garrison McMullen
    title: Instruction Writer
    url: https://github.com/garrison0
    image_url: https://avatars.githubusercontent.com/u/4089393?v=4
---
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque elementum dignissim ultricies. Fusce rhoncus ipsum tempor eros aliquam consequat.
```

</li>

</ol>

### Procedure

<ol>

<li> Create an <code>admin</code> directory inside <code>static</code>.

```bash
cd static
mkdir admin
```

</li> 

<li> In the <code>admin</code> directory, create a <code>config.yml</code> file and an <code>index.html</code> file.

```bash
cd admin
touch config.yml
touch index.html
```

</li> 

<li> Edit <code>index.html</code> to look like this:

```html
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

`index.html` displays the Netlify CMS admin interface. You'll use the admin interface to edit your blog posts.

</li> 

<li> Edit <code>config.yml</code> to look like this: 

```yaml
backend:
  name: github
  branch: main 
  repo: <your-github>/my-website

# These lines should *not* be indented
media_folder: "static/img" # Media files will be stored in the repo under static/images/uploads
public_folder: "/img/" # The src attribute for uploaded media will begin with /images/uploads

collections:
- name: blog
  label: "blog"
  folder: blog
  identifier_field: title
  extension: md
  widget: "list"
  create: true
  slug: "{{year}}-{{month}}-{{day}}-{{slug}}" # Filename template, e.g., YYYY-MM-DD-title.md
  fields:
    - { name: title, label: Title, widget: string }
    - { name: body, label: Body, widget: markdown }
    - { name: slug, label: Slug, widget: string }
    - label: "Tags"
      name: "tags"
      widget: "list"
    - label: "Authors"
      name: "authors" 
      widget: "list"
      fields:
        - { name: name, label: Name, widget: string }
        - { name: title, label: Title, widget: string } 
        - { name: url, label: URL, widget: string } 
        - { name: imageUrl, label: ImageURL, widget: string } 
```

`config.yml` specifies what kind of content your blog posts have. The content specification enables Netlify CMS to edit existing posts and create new ones with the same format. To learn more, read about Netlify CMS' [](https://www.netlifycms.org/docs/configuration-options/)[Configuration options](https://www.netlifycms.org/docs/configuration-options/).
</li> 

<li>
Visit <code>localhost:3000/admin</code>

You can now view and edit `2021-11-15-first-blog-post.md` through the admin interface. You can also create new blog posts. 

**Warning:** Any changes you publish through the admin interface will only effect your *remote GitHub repository*. To retrieve these changes locally, `git pull` from your local repository.
</li>

<li> Commit and push your new changes to your remote repository. 

```bash
git add . 
git commit -m "Add Netlify CMS"
git push
```

Netlify builds and deploys your new changes. 

</li>

</ol>

## Add GitHub as an authentication provider

Before you can access `/admin/` through your Netlify domain, you need to set up an authentication provider. The authentication provider allows Netlify CMS to determine whether users have read and write access to `/admin/`. This guide uses GitHub credentials for authentication. 

### Configure GitHub 

1. Create a new [GitHub OAuth application](https://github.com/settings/applications/new). 
2. Enter your Netlify domain as the **Homepage URL**.
3. Enter <code>https://api.netlify.com/auth/done</code> as the **Authorization callback URL**.
4. Click **Register application.**
5. Click **Generate a new client secret.** 
6. Copy the provided client secret and client ID.

### Configure Netlify

1. On Netlify, under `Site Settings > Access control > OAuth > Authentication Providers`, click **Install provider**.
2. Enter your client secret and client ID from GitHub.
3. Click **Install**.

🎉 All done! Now you can access the admin interface through your Netlify URL.