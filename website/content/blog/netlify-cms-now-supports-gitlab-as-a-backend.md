---
title: Netlify CMS now supports GitLab as a backend
author: Benaiah Mischenko
description: >-
  Netlify CMS, the open source, headless CMS that provides a user-friendly UI
  around your Git repository, can now be used with GitLab in addition to
  GitHub.
date: '2018-06-13'
---
Netlify CMS is releasing support for GitLab as a backend, creating the world's first completely open source stack for Git-based content editing.

<iframe width="100%" height="400" src="https://www.youtube.com/embed/ZrM3U0z8Sks?autoplay=1&loop=1&playlist=ZrM3U0z8Sks&mute=1&controls=0&modestbranding=1&showinfo=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

We heard [you](https://github.com/netlify/netlify-cms/pull/517#issuecomment-383283557) (and [you](https://github.com/netlify/netlify-cms/pull/517#issuecomment-355386542), and [you](https://github.com/netlify/netlify-cms/pull/517#issuecomment-343569725), and [you](https://github.com/netlify/netlify-cms/pull/517#issuecomment-333629637))! While you want to use Netlify CMS as the headless content management system for your JAMstack projects, all of your code lives in GitLab. Our long-term vision is to be tool-agnostic so you can use whatever tool helps you work best. But while you can already use Netlify CMS with most static site generators, backend support was limited to GitHub.

Immediately after the December release of Netlify CMS 1.0, contributors got to work on improving the API for backend integrations. At the urging of the community, we prioritized support for GitLab. With today’s release of Netlify CMS 1.9.0, you can now use GitLab as the backend for Netlify CMS.

Adding support for GitLab means that millions more developers can now use Netlify CMS with their projects. Seriously — millions. GitLab is used by more than 100,000 organizations like Ticketmaster, Intel, Red Hat, and CERN.

## How it works

Netlify CMS is an open source content management system for your Git workflow that enables you to provide editors with a friendly UI and intuitive workflow. You can use it with any static site generator to create faster, more flexible web projects. Content is stored in your GitLab repository alongside your code for easier versioning, multi-channel publishing, and the option to handle content updates directly in Git.

In case you want an even easier way to get started, or just want to poke around in the code, you can use the button below to automatically deploy a starter site that uses the Hugo static site generator along with Netlify CMS. 

<a href="https://app.netlify.com/start/deploy?repository=https://gitlab.com/netlify-templates/one-click-hugo-cms&stack=cms" rel="nofollow noreferrer noopener" target="_blank"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify"></a>

Lastly, one particularly exciting thing about using GitLab as your backend is that it doesn’t require an authentication server. While the GitHub integration requires a hop to an authentication server (something Netlify provides for most users), GitLab’s implicit auth flow allows you to connect directly from your browser to gitlab.com, or even to your own self-hosted GitLab server!

## What’s next

We’re already working toward [Bitbucket](https://github.com/netlify/netlify-cms/pull/525) support and will be releasing it as soon as possible! We’re also focused on the upcoming release of [Netlify CMS 2.0](https://github.com/netlify/netlify-cms/issues/1280), which will bring new image handling features and improvements, and improved APIs for better CMS extensions. We’re also looking for more ideas and helping hands, so if you’re keen to build a smarter, safer, and more scalable CMS, we’d love your contributions. Give us a shout on [Twitter](https://twitter.com/netlifycms) or Gitter if you have questions or ideas.
