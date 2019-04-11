---
title: Deploy Preview Links
author: Shawn Erquhart
description: >-
  Deploy preview links from your GitHub repository are now surfaced in Netlify
  CMS for previewing builds of unpublished content.
twitter_image: /img/preview-link-unpublished.png
date: 2019-02-08T19:30:00.000Z
---
Netlify CMS 2.4.0 brings deploy preview links!

![Deploy preview link for unpublished content](/img/preview-link-unpublished.png)

## Seeing is believing

The editorial workflow allows editors to create draft content in Netlify CMS, and Netlify can
provide deploy previews of draft content, but there hasn't been a way to access links to these
preview builds from within Netlify CMS. The preview pane in the editor is a good tool for seeing how
content will look on the site, but in the words of Marvin Gaye, "ain't nothing like the real thing!"
As Mr. Gaye bemoaned the absence of his beloved, so content creators long for the warm embrace of an
actual production build. Their words, not ours.

## Solution: GitHub Statuses

![GitHub statuses](/img/github-statuses-deploy-previews.png)

For sites using the GitHub (or Git Gateway with GitHub) backend, we now have deploy preview links in
the CMS using the [GitHub Statuses
API](https://developer.github.com/v3/repos/statuses/#get-the-combined-status-for-a-specific-ref).
Many static sites already have continuous deployment and deploy previews configured on their repo,
and they often use statuses to provide a link to a deployment directly from a commit or pull
request. To retrieve a commit status that provides a deploy preview URL, we check for a status whose
"context" contains one of a list of keywords commonly associated with deploy previews.

If a status is not found, nothing happens in the UI. If a status is found, but the deploy preview
isn't ready, we provide a "Check for Preview" link, allowing the content editor to manually check
back until the preview is ready:

![Deploy preview link for unpublished content](/img/preview-link-check.png)

When the preview is ready, the "Check for Preview" button is replaced with a link to the content:

![Deploy preview link for unpublished content](/img/preview-link-unpublished.png)

## Deep links
Deploy preview links generally direct to the root of a site, but Netlify CMS can also link straight
to the piece of content being edited. By [providing a string template](/docs/deploy-preview-links)
for each collection, you can get links that go right where editors expect them to. More complex
URL's can be constructed [using date
information](/docs/deploy-preview-links/#dates-in-preview-paths) from your content files.

## Unpublished vs. published
If you're not using the editorial workflow, you may not feel you need this very much. Whenever you
save content, it's immediatlely published, so you can navigate to your live site to see the changes.
That said, it's at least convenient to have a link direct to your content from the CMS, so deploy
preview links can also work for CMS installs that do not use the editorial workflow. Instead of
retrieving a URL from a commit status, this functionality requires setting a `site_url` in your
config, and that URL is used in place of the deploy preview URL.

## GitLab and Bitbucket
Support is coming soon for these two awesome backends! Stay tuned.

## Try it out!
Deploy preview links are live in Netlify CMS 2.4.0. Please give them a try and let us know if you
have any problems by [opening an issue](https://github.com/netlify/netlify-cms/issues/new) or
reaching out in our [community chat on Gitter](https://gitter.im/netlify/netlifycms)!
