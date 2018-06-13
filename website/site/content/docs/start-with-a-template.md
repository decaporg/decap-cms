---
title: Start with a Template
weight: 10
menu:
  docs:
    parent: start
---

# Start with a Template

Netlify CMS can be [added to an existing site](https://www.netlifycms.org/docs/add-to-your-site), but the quickest way to get started is with a template. Our featured templates below deploy to Netlify, giving you a fully working CMS-enabled site with just a few clicks.

<div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 1.5em;">
    <div>
        <h4>Hugo Site Starter</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/one-click-hugo-cms&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
    <div>
        <h4>Gatsby Site Starter</h4>
        <p><a href="https://app.netlify.com/start/deploy?repository=https://github.com/AustinGreen/gatsby-starter-netlify-cms&amp;stack=cms"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a></p>
    </div>
</div>

After clicking one of those buttons, you’ll authenticate with GitHub or GitLab and choose a repository name. Netlify will then automatically create a clone of the repository in your GitHub or GitLab account. Next, it will build and deploy the new site on Netlify, bringing you to the site dashboard when the build is complete.


## Access Netlify CMS on your new site

1. The template deploy process will send you an invitation to your new site, sent from `no-reply@netlify.com`.

    ![Sample email subject line: You've been invited to join radiologist-amanda-53841.netlify.com](https://www.netlifycms.org/img/email-subject.png?raw=true)

2. Click the link to accept the invite, and you’ll be directed to your site, with a prompt to create a password.

    !["Complete your signup" modal on the Kaldi coffee site](https://www.netlifycms.org/img/create-password.png?raw=true)

3. Enter a password, sign in, and you’ll be directed straight to the CMS. (For future visits, you can go straight to `<yoursiteaddress.com>/admin/`.)

Try adding and editing posts, or changing the content of the Products page. When you save, the changes will be pushed immediately to your Git repository, triggering a build on Netlify, and updating the content on your site. Check out the configuration code by visiting your site repo.

## More paths to explore

- To see how to integrate Netlify CMS into an existing project, go to [Add to your site](https://www.netlifycms.org/docs/add-to-your-site).
- Check out other sites using Netlify CMS (or share your own!) on the [Examples](https://www.netlifycms.org/docs/examples/) page.
- If you’d like to add more CMS editors or change how they log in to your site, read up on [Netlify Identity service](https://www.netlify.com/docs/identity).
