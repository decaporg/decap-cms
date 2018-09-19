---
title: Introduction
weight: 1
group: start
---

Netlify CMS is an open source content management system for your Git workflow that enables you to provide editors with a friendly UI and intuitive workflows. You can use it with any static site generator to create faster, more flexible web projects. Content is stored in your Git repository alongside your code for easier versioning, multi-channel publishing, and the option to handle content updates directly in Git.

At its core, Netlify CMS is an open-source React app that acts as a wrapper for the Git workflow, using the GitHub, GitLab, or Bitbucket API. This provides many advantages, including:

* **Fast, web-based UI:** With rich-text editing, real-time preview, and drag-and-drop media uploads.
* **Platform agnostic:** Works with most static site generators.
* **Easy installation:** Add two files to your site and hook up the backend by including those files in your build process or linking to our Content Delivery Network (CDN).
* **Modern authentication:** Using GitHub, GitLab, or Bitbucket and JSON web tokens.
* **Flexible content types:** Specify an unlimited number of content types with custom fields.
* **Fully extensible:** Create custom-styled previews, UI widgets, and editor plugins.

## Netlify CMS vs. Netlify

[Netlify.com](https://www.netlify.com/) is an automation and deployment platform. It can host your static site and serve as a CDN with lots of other useful functionality totally unrelated to content management. Most Netlify customers don't use Netlify CMS and many have never even heard of it!

Netlify solved a lot of problems in the static site generation space, but one thing that was missing was an open-source, extensible editing tool. So, we made a CMS and for better or for worse we decided to call it Netlify CMS. The CMS is made to work independently of Netlify (despite the name).

* You can use Netlify CMS without Netlify and deploy your site where you always have, hooking up your own CI, site hosting, CDN, etc.
* You can use Netlify without Netlify CMS and edit your static site in your code editor.
* Or, you can use them together and have a fully-working CMS-enabled site with [one click](../start-with-a-template/)!

If you hook up Netlify CMS to your website, you're basically adding a tool for content editors to make commits to your site repository without touching code or learning git.

## Find out more

- Get a feel for the UI in the [demo site](https://cms-demo.netlify.com). (No login required. Click the login button to go straight to the CMS editor UI.)
- [Start with a template](../start-with-a-template/) to make a Netlify CMS-enabled site of your own.
- Configure your existing site by following a [tutorial](../add-to-your-site/) or checking [configuration options](../configuration-options).
- Ask questions and share ideas in the Netlify CMS community on [Gitter](https://gitter.im/netlify/netlifycms).
- Get involved in new developments and become a [contributor](https://docs-starters--netlify-cms-www.netlify.com/docs/contributor-guide/).
