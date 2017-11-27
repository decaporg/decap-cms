# Take a test drive

Netlify CMS can run in any frontend web environment, but the quickest way to try it out is by running it on a pre-configured starter site with Netlify. Our example here is the [Kaldi coffee company template](https://github.com/netlify-templates/one-click-hugo-cms). Use the button below to build and deploy your own copy of the repository:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/one-click-hugo-cms&stack=cms)

After clicking that button, you’ll authenticate with GitHub and choose a repository name. Netlify will then automatically create a repository in your GitHub account with a copy of the files from the template. Next, it will build and deploy the new site on Netlify, bringing you to the site dashboard when the build is complete. Next, you’ll need to set up Netlify's [Identity](https://www.netlify.com/docs/identity) service to authorize users to log in to the CMS.

## Adding users

1. From the Netlify site dashboard, select the **Identity** tab, and you'll find that there are no users yet. By default, this site is set to accept users by invitation only, and even the site owner needs to be invited.
2. Select **Invite users**, enter your email address, and select Send.
3. Check your email for the invitation. It will be sent from `no-reply@netlify.com`.

    ![Sample email subject line: You've been invited to join radiologist-amanda-53841.netlify.com](/img/email-subject.png?raw=true)

4. Click the link to accept the invite, and you’ll be directed to your new site, with a prompt to create a password.

    !["Complete your signup" modal on the Kaldi coffee site](/img/create-password.png?raw=true)

5. Enter a password, sign in, and you’ll be directed straight to the CMS!

Try adding and editing posts, or changing the content of the Products page. When you save, the changes will be pushed immediately to GitHub, triggering a build on Netlify, and updating the content on your site.

## More paths to explore
- If you’d like to learn more about how it all works, check out the [Intro](/docs/intro). 
- To see how to integrate Netlify CMS into an existing project, go to the [Quick Start](/docs/quick-start).
- If you’d like to change how users log in to your site, read up on [Netlify Identity service](https://www.netlify.com/docs/identity).
