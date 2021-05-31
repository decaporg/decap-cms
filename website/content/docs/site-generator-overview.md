---
title: Overview
group: Guides
weight: 1
---

The process for adding Netlify CMS to a static site can be divided into four main steps:

### Install Netlify CMS

This is a single page app available at the `/admin` route of your website.
Check out the [general overview](/docs/intro/) to see what the installation process entails.

### Set up a backend

This serves two purpose: Secure access to your website's Netlify CMS and allows it to read and update content files in your repo. More information about configuring the backend can be found [here](/docs/backends-overview/).

### Configure Netlify CMS using a configuration file

For starters, you can get by with a basic configuration that includes required information like Git provider, branch and folders to save files to.

Once you've gotten the hang of it, you can use the file to build whatever collections and content modeling you want. Check out the [this section](/docs/configuration-options/#configuration-file) for full details about all available configuration options.

### Render the content provided by Netlify CMS as web pages

Netlify CMS manages your content, and provides editorial and admin features, but it doesn't deliver content. It only makes your content available through an API.

It is up to developers to determine how to build the raw content into something useful and delightful on the frontend.

To learn how to query raw content managed by Netlify CMS and reformat them for delivery to end users, please refer the dedicated section for your site generator in the Table of Content.
___
### Local development

If you are experimenting with Netlify CMS or testing things out, you can connect it to a local Git repository instead of a live one. Learn how to do it [here](/docs/beta-features/#working-with-a-local-git-repository).
