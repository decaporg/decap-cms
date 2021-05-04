---
title: Overview
group: Guides
weight: 1
---

A common pain point with static site generators is that they are hard to use for non-technical editors. Raw content is stored together with source codes in a Git repository. Making changes to the site content, therefore, requires users to go through a sequence of steps:

- Navigate into the site repository
- Creating or editing files for rendering site content, usually Markdown, JSON, YAML files.
- Stage and commit changes to the local repository.
- Push changes to the remote repository, which will trigger site build and deployment.

Netlify CMS was created to fill this gap. You can integrate it into any site built with a common static site generators, including but not limited to Gatsby, Jekyll, Hugo. This allows non-technical editors to create and edit content through a solid user interface. They won't even know that they are pushing commits to a Git repository.

The process for adding Netlify CMS to your site can vary depending on the site generator that was used. However, from a high level, it comprises of three main steps:

- Install Netlify CMS as a frontend app at the `/admin` route of the your published site.
- Setting up the backend to authenticate CMS users with the Git provider which stores your project.
- Render the Netlify CMS output on the frontend.

## Installing Netlify CMS on the frontend

The frontend of the app contains the following major components:

- user authentication form
- dashboard for managing content reserved for authenticated users only.
- rich text editor built with [Slate](https://github.com/ianstormtaylor/slate) that also supports Markdown syntax.

Most site generators come with custom plugins that simplies the installation of the Netlify CMS app.

## Authenticate CMS users with a backend

Netlify CMS doesn't store your site content. Think of it as a middleman that allows your CMS users to make changes to your Git repository without having an account with Github, Gitlab etc.

To achieve that, Netlify CMS needs to make sure that users have the write access to an online Git repository. This means the backend of the app is just Javascript codes that authenticates users with the Git provider which stores the site project.

The authentication process requires a server and setting up a backend. You can write your own backend, or deploy your site to Netlify and get two authentication microservices that simplify this process: Netlify Identity and Git Gateway.

It is also helpful to remember that Netlify CMS is meant to work in production. Every time the repoitory changes, whether in the source codes or raw content, the website is rebuilt and redeployed automatically.

For experimentation, you can run Netlify CMS locally, albeit with a catch. Each content edit through Netlify CMS results in a new commit to your remote repository. This means that you will need to pull changes from your remote each time to see them in the locally served site.

For more information, read the Authentication section in the [Add to Your Site page](https://www.netlifycms.org/docs/add-to-your-site/).

## Render Netlify CMS output on the frontend

Once you've made your first post with Netlify CMS, head to your site repository and you'll find the latest commit containing the file with your post content.

However, the integration process is not stopped here.Going back to your published site, you'll notice that even though you have a new file in your repository, it's not anywhere on your site. That's because Netlify CMS doesn't go beyond creating the raw content, which is one reason why it is able to work with many static site genetors.

It is up to developers to determine how to build the raw content into something useful and delightful on the frontend. To learn how to process raw content from Netlify CMS, go to the section for your site generator in the Table of Content and follow its instructions.
