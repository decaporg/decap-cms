---
title: Basic Steps
group: Add
weight: 1
---

This tutorial guides you through the steps for adding Decap CMS to a site that's built with a common [static site generator](https://www.staticgen.com/), like Jekyll, Hugo, Hexo, or Gatsby.
Alternatively, you can [start from a template](/docs/start-with-a-template) or dive right into [configuration options](/docs/configuration-options). The process for adding Decap CMS to a static site can be divided into four main steps:

**1. Install Decap CMS**

This is a single page app available at the `/admin` route of your website.
Check out the [general overview](/docs/intro/) to see what the installation process entails.

**2. Choosing a Backend**

The most common backends are GitHub, GitLab, Bitbucket, and Azure. The backend serves two purpose: Secure access to your website's Decap CMS and allows it to read and update content files in your git repo. More information about configuring the backend can be found [here](/docs/backends-overview/).

If you are experimenting with Decap CMS or developing, you can connect to it via a [local Git repository instead](/docs/working-with-a-local-git-repository/) of a remote backend.

**3. Configure Decap CMS**

The basic configuration includes required information like Git backend provider, branch, and collections to save files to.
It is recommended to start simple as possible. Once you've gotten the hang of it, you can edit your `config.yml` file to 
build whatever collections and content modeling you want.

Check out the [Configuration Options](/docs/configuration-options/) page for full details about all available options.

**4. Access Your Content**

Decap CMS manages your content and provides editorial and admin features via a webpage in a browser, but it doesn't deliver content. Decap CMS only makes your content available through an API. It is up to developers to determine how to build the raw content into something useful and delightful on the frontend within your static site generator.

---

If you are ready to get started, proceed to: [1. Install Decap CMS](/docs/install-decap-cms/)
