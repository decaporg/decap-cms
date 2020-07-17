---
title: Known Issues and Solutions
weight: 20
group: support
---

## Background

There are a couple of issues that users face while integrating or working with Netlify CMS and while the community is doing their best fixing them, here is a list of known issues and their solutions.

## API Errors.

A list of error messages and their possible cause(s) to provide more context while debugging.

#### 1. Error Message.

```
API_ERROR: Not Found.
```

#### Possible Cause.

- The org account needs to grant access to your Netlify CMS instance. [More details](https://help.github.com/en/github/setting-up-and-managing-your-github-user-account/requesting-organization-approval-for-oauth-apps).

#### 2. Error Message

```
Failed to load settings from /.netlify/identity
```

#### Possible Cause.

- `config.yml` has git-gateway as a backend on a site that isn't hosted on Netlify.

## Other Issues

#### 1. Invited Users Email not Confirmed.

If you’ve invited some users and opened the invitation link from the generated emails but as they try to log in they get the following error message:

```
Email not confirmed
```

#### Possible Solutions.

- Add the identity widget to your homepage `<head>`. The upside of this method is that it’s fast and easy, no other configuration needed. The downside is that all of your users are downloading the widget while they might not need it. That’s kb’s wasted. Unless you’re using Netlify Identity for something else than the authentication of CMS users, utilize the next solution.

- Change the invitation emails! This takes a bit more time, but it’s probably the cleanest solution. You already have the identity widget loaded at your `admin/` page, so you might as well have your users confirm their email there. Learn how to update your invitation emails [here](https://docs.netlify.com/visitor-access/identity/identity-generated-emails/#email-templates).

Credits to [@tomrutgers](https://github.com/tomrutgers). Check here for [more details](https://community.netlify.com/t/common-issue-netlify-cms-git-gateway-email-not-confirmed/10690).

#### 2. Invitation Email not Received.

If you deployed Netlify CMS to Netlify using a template and didn't receive an invitation email after deploying the site, check your email settings to make sure that your email provider doesn't block emails from no-reply@netlify.com.

#### 3. Mobile Responsiveness.

To make Netlify CMS responsive for usage on mobile, [here](https://gist.github.com/lilpolymath/51082130d316df3a938648569077c933) is a temporary CSS solution to include to your `admin/index.html` below your closing `</body>` tag so it can overwrite netlify-generated css.

Credits to [truongoi](https://github.com/truongoi).

#### 4. Access Private Repo with Netlify CMS.

If you are unable to access the admin panel of a private repo belonging to an organization, follow these steps.

- Go to https://github.com/settings/applications.
- Select Authorized OAuth Apps tab.
- Click on Netlify CMS.
- Click on Grant next to your organization name.

Credits to [Amadeusz Annissimo ](https://github.com/amadeann).

#### 5. Netlify CMS local update doesn't reflect.

You can either disable `gatsby-plugin-offline` or remove `CMS/` from the list of directories to cache ([check here](https://www.gatsbyjs.org/packages/gatsby-plugin-offline/#overriding-workbox-configuration)).

In case you want to remove `gatsby-plugin-offline` from your site, follow these steps.

1. Run these

```
npm uninstall gatsby-plugin-offline
npm install gatsby-plugin-remove-serviceworker
```

2. Then update your `gatsby-config.js` file

```
 plugins: [
 -  `gatsby-plugin-offline`,
 +  `gatsby-plugin-remove-serviceworker`,
 ]
```

This removes the serviceworker clearing all the cached data instead of leaving your users with an outdated version of your site. You can safely remove this plugin after a few weeks.
