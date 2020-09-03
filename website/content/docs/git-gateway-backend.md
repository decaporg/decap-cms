---
title: Git Gateway
weight: 10
group: Accounts
---

[Git Gateway](https://github.com/netlify/git-gateway) is a Netlify open source project that allows you to add editors to your site CMS without giving them direct write access to your GitHub or GitLab repository. (For Bitbucket repositories, use the [Bitbucket backend](#bitbucket-backend) instead.)

## Git Gateway with Netlify

The [Netlify Identity](https://www.netlify.com/docs/identity/) service can handle the authentication and provides a simple interface for user management. The Netlify CMS [featured templates](../start-with-a-template) are working examples of this backend.

To use it in your own project stored on GitHub or GitLab, follow these steps:

1. Head over to the [Netlify Identity docs](https://www.netlify.com/docs/identity) and follow the steps to get started.
2. Add the following lines to your Netlify CMS `config.yml` file:

```yaml
backend:
  name: git-gateway
```

## Reconnect after Changing Repository Permissions

If you change ownership on your repository, or convert a repository from public to private, you may need to reconnect Git Gateway with proper permissions. Find further instructions in the [Netlify Git Gateway docs](https://www.netlify.com/docs/git-gateway/#reconnect-after-changing-repository-permissions).

## Git Gateway without Netlify

You can use [Git Gateway](https://github.com/netlify/git-gateway) without Netlify by setting up your own Git Gateway server and connecting it with your own instance of [GoTrue](https://www.gotrueapi.org) (the open source microservice that powers Netlify Identity), or with any other identity service that can issue JSON Web Tokens (JWT).

To configure in Netlify CMS, use the same `backend` settings in your Netlify CMS `config.yml` file as described in Step 2 of the [Git Gateway with Netlify Identity](#git-gateway-with-netlify-identity) instructions above.
