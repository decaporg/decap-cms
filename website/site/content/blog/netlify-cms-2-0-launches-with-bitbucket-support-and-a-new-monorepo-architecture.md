---
title: >-
  Netlify CMS 2.0 launches with BitBucket support and a new monorepo
  architecture
author: Phil Hawksworth
description: >-
  Announcing the release of Netlify CMS v2.0, with new BitBucket support and an
  improved project architecture designed to ease contribution and the extension
  of features.
date: '2018-07-24'
---
Today we’re releasing Netlify CMS 2.0, which adds support for using BitBucket as a backend. 

With this release, [Netlify CMS](https://www.netlifycms.org/) now supports all major Git collaboration providers, adding Bitbucket to the list of supported providers which already includes GitLab and GitHub. 

While you could already use Netlify CMS with most static site generators, our long-term vision is to be tool-agnostic so you can use whatever tool helps you work best. The latest release brings us one step closer by giving the option of an open source, Git-centric CMS to tens of thousands of businesses that depend on BitBucket, including 60 of the Fortune 100. 

## How it works

Netlify CMS is an open source content management system which harnesses your Git workflow. It enables you to provide editors with a friendly UI and intuitive workflow, while not requiring them to understand Git. You can use it with any static site generator to create faster, more flexible web projects. Content can be stored in your BitBucket repository alongside your code for easier versioning, multi-channel publishing, and the option to handle content updates directly in Git.

<img src="https://d33wubrfki0l68.cloudfront.net/61c8fbd66484ebe1428e1de0800e2f1a4a54adc2/457ed/img/screenshot-editor.jpg" />

## Becoming a Monorepo

The other big change with 2.0 is the migration from a single codebase to a collection of interdependent packages called a “monorepo”. Netlify CMS still lives in a [single repository on GitHub](https://github.com/netlify/netlify-cms), but the many extensions that were kept within Netlify CMS itself are now completely separate from the application core. This brings a few benefits:

* Extension authors can easily copy an existing extension from the Netlify CMS repo and create a custom version.
* Your custom extensions can now do anything the “official” extensions can do (because official extensions are no longer taking advantage of privileged internal code).
* The monorepo approach provides a foundation that will encourage a more modular CMS, with shared parts that make extension authoring easier.

## What’s next

Upcoming feature releases will bring new image handling features and a number of improved APIs, adding even more possibilities to future CMS extensions.

We’re always looking for more ideas and helping hands, so if you want to help build a smarter, safer, and more scalable CMS, we’d love your [contributions](https://www.netlifycms.org/docs/contributor-guide/). Give us a shout on [Twitter](https://twitter.com/netlifycms) or [Gitter](https://github.com/netlify/netlify-cms/pull/525) if you have questions or ideas.
