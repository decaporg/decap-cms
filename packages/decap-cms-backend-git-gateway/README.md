# Git Gateway

Netlify's [gateway](https://github.com/netlify/git-gateway) to hosted git APIs.

## Code structure

`Implementation` for [File Management System API](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-util/README.md) based on `Api`.

`Api` and `Implementation` from backend-[github](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-backend-github/README.md)/[gitlab](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-backend-gitlab/README.md)/[bitbacket](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-backend-bitbacket/README.md) extended with Netlify-specific `LargeMedia(LFS)` and `JWT` auth.

`AuthenticationPage` - uses [lib-auth](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-auth/README.md) and implements Netlify Identity authentication flow.

Look at tests or types for more info.

## Debugging

When debugging the CMS with Git Gateway you must:

1. Have a Netlify site with [Git Gateway](https://docs.netlify.com/visitor-access/git-gateway/) and [Netlify Identity](https://docs.netlify.com/visitor-access/identity/) enabled. An easy way to create such a site is to use a [template](https://www.decapcms.org/docs/start-with-a-template/), for example the [Gatsby template](https://app.netlify.com/start/deploy?repository=https://github.com/decaporg/gatsby-starter-decap-cms&stack=cms)
2. Tell the CMS the URL of your Netlify site using a local storage item. To do so:

    1. Open `http://localhost:8080/` in the browser
    2. Write the below command and press enter: `localStorage.setItem('netlifySiteURL', 'https://yourwebsiteurl.netlify.app/')`
    3. To be sure, you can run this command as well: `localStorage.getItem('netlifySiteURL')`
    4. Refresh the page
    5. You should be able to log in via your Netlify Identity email/password
