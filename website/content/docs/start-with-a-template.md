---
group: Intro
weight: 2
title: Start with a Template
---
You can add Netlify CMS [to an existing site](/docs/add-to-your-site/), but the quickest way to get started is with a template.  Found below, our featured templates deploy a bare-bones site and Netlify CMS to Netlify ([what's the difference, you ask?](../intro/#netlify-cms-vs-netlify)), giving you a fully working CMS-enabled site with just a few clicks.

<div style="display: flex; justify-content: left; text-align: center; margin-bottom: 1.5em; flex-wrap: wrap;"stack=cms>
    <div style="flex-basis: 33%">
        <div style="padding: 0 15%; height: 100px; display: flex; justify-content: center;">
          <img style="display: flex" src="/img/hugo.svg"/>
        </div>
        <h4>Hugo Site Starter</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/one-click-hugo-cms&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
    <div style="flex-basis: 33%">
        <div style="padding: 0 30%; height: 100px; display: flex; justify-content: center;">
          <img style="display: flex" src="/img/gatsby.svg"/>
        </div>
        <h4>Gatsby Site Starter</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/AustinGreen/gatsby-starter-netlify-cms&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
    <div style="flex-basis: 33%">
        <div style="padding: 0 30%; height: 100px; display: flex; justify-content: center;">
          <img style="display: flex" src="/img/middleman.svg"/>
        </div>
        <h4>Middleman Site Starter</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/tomrutgers/middleman-starter-netlify-cms&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
    <div style="flex-basis: 33%">
        <div style="padding: 0 30%; height: 100px; display: flex; justify-content: center;">
          <img style="display: flex" src="/img/preact.svg"/>
        </div>
        <h4>Preact CLI</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/preactjs/preact-netlify&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
    <div style="flex-basis: 33%">
        <div style="padding: 0 30%; height: 100px; display: flex; justify-content: center;">
          <img style="display: flex" src="/img/nextjs.svg"/>
        </div>
        <h4>Next.js Blog Template</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/wutali/nextjs-netlify-blog-template&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
    <div style="flex-basis: 33%">
        <div style="padding: 0 30%; height: 100px; display: flex; justify-content: center;">
         <a href="https://github.com/surjithctly/neat-starter"> <img style="display: flex" src="/img/11ty-logo.svg"/> </a>
        </div>
        <h4>Eleventy Starter</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/surjithctly/neat-starter&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
    <div style="flex-basis: 33%">
        <div style="padding: 0 30%; height: 100px; display: flex; justify-content: center;">
          <img style="display: flex" src="/img/nuxt.svg"/>
        </div>
        <h4>Nuxt.js Boilerplate</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/Knogobert/ntn-boilerplate&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
</div>

After clicking one of those buttons, authenticate with GitHub or GitLab and choose a repository name. Netlify then automatically creates a clone of the repository in your GitHub or GitLab account. Next, it builds and deploys the new site on Netlify, bringing you to the site dashboard after completing the build.

**Note for Bitbucket users:** Netlify CMS supports Bitbucket repositories, but Bitbucket's permissions won't work with the Deploy to Netlify buttons above. You can still set up a repository manually, or follow the [tutorial](/docs/add-to-your-site) for adding Netlify CMS to an existing site.

## Access Netlify CMS on your new site

1. The template deploy process sends you an invitation to your new site, sent from `no-reply@netlify.com`.
   ![Sample email subject line: You've been invited to join radiologist-amanda-53841.netlify.com](https://www.netlifycms.org/img/email-subject.png?raw=true)
2. Wait for the deployment to complete, then click the link to accept the invite. Your site will open with a prompt to create a password.
   !["Complete your signup" modal on the Kaldi coffee site](https://www.netlifycms.org/img/create-password.png?raw=true)
3. Enter a password, sign in, and you’ll go to the CMS. (For future visits, you can go straight to `<yoursiteaddress.com>/admin/`.)

Try adding and editing posts, or changing the content of the Products page. When you save, the changes are pushed immediately to your Git repository, triggering a build on Netlify, and updating the content on your site. Check out the configuration code by visiting your site repo.

## More paths to explore

* To see how to integrate Netlify CMS into an existing project, go to [Add to your site](/docs/add-to-your-site/).
* Check out other sites using Netlify CMS (or share your own!) on the [Examples](/docs/examples/) page.
* If you’d like to add more CMS editors or change how they log in to your site, read up on [Netlify Identity service](https://www.netlify.com/docs/identity).