# Git Gateway

Netlify's [gateway](https://github.com/netlify/git-gateway) to hosted git APIs.

## Code structure

`Implementation` for [File Management System API](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-util/README.md) based on `Api`.

`Api` and `Implementation` from backend-[github](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-backend-github/README.md)/[gitlab](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-backend-gitlab/README.md)/[bitbacket](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-backend-bitbacket/README.md) extended with Netlify-specific `LargeMedia(LFS)` and `JWT` auth.

`AuthenticationPage` - uses [lib-auth](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-auth/README.md) and implements Netlify Identity authentication flow.

`PKCEAuthenticationPage` = uses [lib-auth](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-auth/README.md) and implements OAuth2 PKCE authentication flow. Enabled if the config.auth_type is set to `pkce`.

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

## PKCE with custom Git-Gateway

To use a custom Git-Gateway implementation with PKCE authentication, use a configuration similar to the following:

    backend:
        name: git-gateway
        # Enables PKCE authentication with the git-gateway backend. After auth,
        # sends the access_token for all requests to the git-gateway host.
        auth_type: pkce
        # The base OAuth2 URL. Here is an obfuscated AWS Cognito example.
        base_url: https://your-cognito-instance.auth.us-east-1.amazoncognito.com
        # If you need to customize the authorize or token endpoints for PKCE, do that here
        #auth_endpoint: oauth2/authorize
        #auth_token_endpoint: oauth2/token
        # The OAuth2 client ID
        app_id: your-oauth2-client-id
        # The base URL of your custom git-gateway. Note that the last part of the path
        # should be "bitbucket", "gitlab", or "github", so the implementation can automatically
        # determine which backend API to use when making requests.
        gateway_url: https://your.gitgateway.host/git-gateway/bitbucket/
        # Override the Netlify git-gateway status check
        status_endpoint: https://your.gitgateway.host/api/v2/components.json
        # Optional: defaults to "master"
        branch: main
