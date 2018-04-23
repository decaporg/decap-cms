---
title: Update the CMS Version
weight: 60
menu:
  docs:
    parent: start
---

# Update the CMS Version

The update procedure for your CMS depends upon the method you used to install Netlify CMS.

## Package Manager

If you are using a package manager like Yarn or NPM, you will use their standard procedure to update. This is how both the Hugo and Gatsby starters are set up.

## CDN

If you are using the CMS through a CDN like Unpkg, then that depends on the version tag you are using. You can find the version tag you are using in the `/admin/index.html` file of your site.

- (Recommended) If you use `^1.0.0`, the CMS will do all updates except major versions automatically.
   - It will upgrade to `1.0.1`, `1.1.0`, `1.1.2`.
   - It will not upgrade to `2.0.0` or higher.
   - It will not upgrade to beta versions.

- If you use `~1.0.0`, the CMS will do only patch updates automatically.
   - It will upgrade `1.0.1`, `1.0.2`.
   - It will not upgrade to `1.1.0` or higher.
   - It will not upgrade beta versions.
