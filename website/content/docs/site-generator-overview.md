---
title: Overview
group: Guides
weight: 1
---

A common pain point with static site generators is that they are hard to use for non-technical editors. Content and source code are stored together in the same Git repository. Making changes to the site content requires editors to go through a sequence of steps:

1. Navigating to the site repository
2. Creating or editing content files such as Markdown, JSON, YAML or TOML files
3. Staging and committing changes to the local repository
4. Pushing changes to the remote repository, which will trigger a site build and deployment

Netlify CMS fills this gap. You can integrate it into any site built with a common static site generator, including but not limited to Gatsby, Hugo, Jekyll, Next.js, Nuxt.js, Middleman and Gridsome. This allows non-technical editors to create and edit content through a solid user interface, abstracting any Git related operations.

The process for adding Netlify CMS to your site can vary between different generators. As a general approach, it has four main steps:

1. Install Netlify CMS under the `/admin` route of your website
2. Secure access to your website's Netlify CMS
3. Add configurations for Netlify CMS
4. Render the content provided by Netlify CMS as web pages

## Adding Netlify CMS to your site

Netlify CMS is a single page app installed at the `/admin` route of your static site. This means that all actions like authentication, creating, editing and saving posts happen on the `/admin` page powered by Javascript. The app doesn't need to reload during the usage and users can enjoy its fast responsiveness.

The frontend of the app contains the following major components:

- A dashboard for managing content
- A rich text editor built with [Slate](https://github.com/ianstormtaylor/slate) that supports Markdown syntax
- A preview pane that renders the content while it's being edited

Installing Netlify CMS on your website is straightforward. Some site generators like Gatsby and Gridsome come with custom plugins that simplies this process.

Even if your generator doesn't, installation typically just requires an `index.html` file and a YAML configuration file. The index file contains two scripts: one loads Netlify CMS from a CDN and builds it, and the other enables Netlify Identity, an authentication service.

For more information, please refer to the section for your static site generator in the table of content.

## Secure access to Netlify CMS

Since Netlify CMS is a frontend app, anyone can visit it at the `/admin` route of your published website. But not everyone should be able to access the admin interface and make changes to your site content.

Preventing unauthorized access to your CMS is done through authentication, which requires setting up a backend.

You can write your own backend, or deploy your site to Netlify and get two features that simplify this process:

- [Netlify Identity](https://www.netlify.com/docs/identity/), an authentication service
- [Git Gateway](https://www.netlifycms.org/docs/git-gateway-backend), an intermediary between the CMS and your Git repository. This means you can do things like having your users log into the CMS admin their accounts on popular social platforms instead of requiring them to have a Github account.

Both projects are open source and you can host them yourselves.

If you decide to use Netlify hosting, you can read more aobut how to enable Netlify Identity and Git Gateway [in this section](https://www.netlifycms.org/docs/add-to-your-site/#authentication/).

## Add configurations for Netlify CMS

Although at this point you can log in, you can't do much yet! Netlify CMS only manages your content. It has no clue about the Git provider and repository it should use to save your content.

Netlify CMS also doesn't know about the structure of various content types that your website is going to have, and the relationship between them.

These are only two of many things you need to inform Netlify CMS, and you do it through a special file at `config.yml`. A CMS is usually highly website-specific, and this file is where you can custom Netlify CMS to the liking of your developers and editors. You can learn how to specify configuration options for Netlify CMS [here](https://www.netlifycms.org/docs/configuration-options/#header).

## Render Netlify CMS output on the frontend

Once you've made your first post with Netlify CMS, head to your site repository and you'll find the latest commit containing the file with your post content.

But the integration process doesn't stop here. Going back to your published site, you'll notice that even though you have a new file in your repository, it's not anywhere on your site. That's because Netlify CMS doesn't go beyond creating the raw content, which is one reason why it is able to work with many static site generator.

Netlify CMS manages your content, and provides editorial and admin features, but it doesn't deliver content. It only makes your content available through an API.

It is up to developers to determine how to build the raw content into something useful and delightful on the frontend.

To learn how to query raw content managed by Netlify CMS and reformat them for delivery to end users, please refer the dedicated section for your site generator in the Table of Content.

