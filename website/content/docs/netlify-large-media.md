---
title: Netlify Large Media
group: media
weight: 10
---

[Netlify Large Media](https://www.netlify.com/features/large-media/) is a [Git LFS](https://git-lfs.github.com/) implementation for repositories connected to Netlify sites. This means that you can use Git to work with large asset files like images, audio, and video, without bloating your repository. It does this by replacing the asset files in your repository with text pointer files, then uploading the assets to the Netlify Large Media storage service.

If you have a Netlify site with Large Media enabled, Netlify CMS (version 2.6.0 and above) will handle Large Media asset files seamlessly, in the same way as files stored directly in the repository.

## Requirements

To use Netlify Large Media with Netlify CMS, you will need to do the following:

- [Upgrade Netlify CMS](/docs/update-the-cms-version/) to version 2.6.0 or above.
- Configure Netlify CMS to use the [Git Gateway backend with Netlify Identity](/docs/authentication-backends/#git-gateway-with-netlify-identity).
- Configure the Netlify site and connected repository to use Large Media, following the [Large Media docs on Netlify](https://www.netlify.com/docs/large-media/).

When these are complete, you can use Netlify CMS as normal, and the configured asset files will automatically be handled by Netlify Large Media.

## Image transformations

All JPEG, PNG, and GIF files that are handled with Netlify Large Media also have access to Netlify's on-demand image transformation service. This service allows you to request an image to match the dimensions you specify in a query parameter added to the image URL.

You can learn more about this feature in [Netlify's image transformation docs](https://www.netlify.com/docs/image-transformation/).

### Transformation control for media gallery thumbnails

In repositories enabled with Netlify Large Media, Netlify CMS will use the image transformation query parameters to load thumbnail-sized images for the media gallery view. This makes images in the media gallery load significantly faster.

You can disable the automatic image transformations with the `use_large_media_transforms_in_media_library` configuration setting, nested under `backend` in the CMS `config.yml` file:

```
backend:
  name: git-gateway
  ## Set to false to prevent transforming images in media gallery view
  use_large_media_transforms_in_media_library: false
```
