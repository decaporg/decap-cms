---
group: Guides
weight: 80
title: Docusaurus
---
This guide instructs you on how to integrate Netlify CMS with Docusaurus.

#### Before you begin

* Sign up for [GitHub](www.github.com) and [Netlify](www.netlify.com).
* Download [Node.js](https://nodejs.org/en/download/) version 14 or above.
* Download the [GitHub CLI](https://cli.github.com/).

## Create a new Docusaurus project

<ol>

<li> Use Docusaurus to create a site scaffold in the command line.

`npx create-docusaurus@latest my-website classic`

</li> 

<li> Run the development server.

```
cd my-website
npm run start
```

A browser window opens at `http://localhost:3000`. 

The development server now serves your website at `http://localhost:3000`. As you edit the source files in `/my-website/`, you can visit `http://localhost:3000` to preview your changes.

</li>

</ol>

## Push your project to GitHub

Netlify CMS requires a [backend](https://www.netlifycms.org/docs/backends-overview/) to store content. Netlify CMS supports using Git hosts, like GitHub or GitLab, as backends. This guide uses GitHub. 

<ol>

<li> Initialize your \*\*local\*\* Git repository.

`git init`

</li>

<li> Rename your initial branch to match GitHub.

`git branch -m main`

</li>

<li> Stage all your local files to your repository.

`git add .`

</li> 

<li> Commit your staged changes.

`git commit -m 'Initial commit'`

</li>

<li> Create a \*\*remote\*\* repository on GitHub using the GitHub CLI.

`gh repo create my-website`

Don't add a license or a .gitignore. Do add an "origin" git remote.

![](/img/screen-shot-2021-11-15-at-4.16.53-pm.png)

</li> 

<li> Update your remote repository with your locally staged changes. 

`git push -u origin main`

</li>

</ol>

## Publish your project using Netlify

<ol>

<li> Login to Netlify. </li>

<li> On the Team overview page, click \*\*New site from Git\*\*. </li>

<li> Click \*\*GitHub\*\*.</li>

<li> Choose your project's repository. </li>

<li> Click \*\*Deploy site\*\*.</li>

</ol>

Your website is now deployed. Netlify provides you with a randomly generated domain name. On the Site overview page, click the link to see your live website.

## Add Netlify CMS to your project

#### Before you begin

<ol>

<li> Remove all existing posts from \`/blog\`.

`rm -rf ./blog/*`

</li>

<li> Create a new blog post post titled \`2021-11-15-first-blog-post.md\`.

touch ./blog/`2021-11-15-first-blog-post.md`

</li>

<li> Edit \`2021-11-15-first-blog-post.md\` to look like this:

```
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
    imageUrl: https://avatars.githubusercontent.com/u/4089393?v=4
---
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque elementum dignissim ultricies. Fusce rhoncus ipsum tempor eros aliquam consequat.
```

</li>

</ol>

#### Procedure

<ol>

<li> Create an \`admin\` directory inside \`static\`.

`cd static`

`mkdir admin`

</li> 

<li> In the \`admin\` directory, create a \`config.yml\` file and an \`index.html\` file.

`touch config.yml`

`touch index.html`

</li> 

<li> Edit \`index.html\` to look like this:

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

<li> Edit `config.yml` to look like this: 

```yaml
backend:
  name: github
  branch: main 
  repo: [your-github]/my-website

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

`config.yml` specifies what kind of content is in your blog posts. The content specification enables Netlify CMS to edit existing posts and create new ones with the same format. To learn more, read about Netlify CMS' [](https://www.netlifycms.org/docs/configuration-options/)[Configuration options](https://www.netlifycms.org/docs/configuration-options/).

</li> 

<li>

Visit `localhost:3000/admin`

You can now view and edit `2021-11-15-first-blog-post.md` through the admin interface. You can also create new blog posts. 

**Warning:** Any changes you publish through the admin interface will only effect your *remote GitHub repository*. To retrieve these changes locally, `git pull` from your local repository.

</li>

<li> Commit and push your new changes to your remote branch. 

`git add . `

`git commit -m "Add Netlify CMS"`

`git push`

Netlify builds and deploys your new changes. 

</li>

</ol>

## Add GitHub as an authentication provider

Before you can access `/admin/` through your Netlify deployed domain, you need to set up an authentication provider. The authentication provider allows Netlify CMS to determine whether users have read and write access to `/admin/`. This guide uses GitHub credentials for authentication. 

<ol>

<li> Create a new [GitHub OAuth application](https://github.com/settings/applications/new). 

Enter your Netlify domain as the **Homepage URL**.

Enter `https://api.netlify.com/auth/done` as the **Authorization callback URL**.

Click **Register application.**

Click **Generate a new client secret.**

Copy the provided client secret and client ID.

</li>

<li> On Netlify, under `Site Settings > Access control > OAuth > Authentication Providers`, click **Install provider**.

Enter your client secret and client ID from GitHub.

Click **Install**.

</li>

</ol>

🎉 Now you can access the admin interface through your deployed URL.