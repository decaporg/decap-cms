---
title: Basic Steps
group: Add
weight: 1
---

This tutorial guides you through the steps for adding Decap CMS to a site that's built with a common [static site generator](https://www.staticgen.com/), like Jekyll, Hugo, Hexo, or Gatsby.

Alternatively, you can [start from a template](/docs/start-with-a-template) or dive right into [configuration options](/docs/configuration-options). The process for adding Decap CMS to a static site can be divided into four main steps:

### Install Decap CMS

This is a single page app available at the `/admin` route of your website.
Check out the [general overview](/docs/intro/) to see what the installation process entails.

### Set up a backend

This serves two purpose: Secure access to your website's Decap CMS and allows it to read and update content files in your repo. More information about configuring the backend can be found [here](/docs/backends-overview/).

If you are experimenting with Decap CMS or developing, you can connect to it via a [local Git repository instead](/docs/working-with-a-local-git-repository/) of a remote backend.

### Configure Decap CMS using a configuration file

For starters, you can get by with a basic configuration that includes required information like Git provider, branch and folders to save files to.

Once you've gotten the hang of it, you can use the file to build whatever collections and content modeling you want. Check out the [this section](/docs/configuration-options/#configuration-file) for full details about all available configuration options.

### Render the content provided by Decap CMS as web pages

Decap CMS manages your content, and provides editorial and admin features, but it doesn't deliver content. It only makes your content available through an API.

It is up to developers to determine how to build the raw content into something useful and delightful on the frontend.

To learn how to query raw content managed by Decap CMS and reformat them for delivery to end users, please refer the dedicated section for your site generator in the Table of Content.
