---
title: Overview
weight: 1
group: intro
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

[Netlify.com](https://www.netlify.com/) is a platform you can use to automatically build, deploy, serve, and manage your frontend sites and web apps. It also provides a variety of other features like form processing, serverless functions, and split testing. Not all Netlify sites use Netlify CMS, and not all sites using Netlify CMS are on Netlify.

The folks at Netlify created Netlify CMS to fill a gap in the static site generation pipeline. There were some great proprietary headless CMS options, but no real contenders that were open source and extensible—that could turn into a community-built ecosystem like WordPress or Drupal. For that reason, Netlify CMS is _made_ to be community-driven, and has never been locked to the Netlify platform (despite the name).

With this in mind, you can:

* Use Netlify CMS without Netlify and deploy your site where you always have, hooking up your own CI, site hosting, CDN, etc.
* Use Netlify without Netlify CMS and edit your static site in your code editor.
* Or, use them together and have a fully-working CMS-enabled site with [one click](../start-with-a-template/)!

If you hook up Netlify CMS to your website, you're basically adding a tool for content editors to make commits to your site repository without touching code or learning Git.

### Find out more

- Get a feel for the UI in the [demo site](https://cms-demo.netlify.com). (No login required. Click the login button to go straight to the CMS editor UI.)
- [Start with a template](../start-with-a-template/) to make a Netlify CMS-enabled site of your own.
- Configure your existing site by following a [tutorial](../add-to-your-site/) or checking [configuration options](../configuration-options).
- Ask questions and share ideas in the Netlify CMS [community chat](https://netlifycms.org/chat).
- Get involved in new developments and become a [contributor](../contributor-guide/).
