---
title: '[WIP] Cloudinary'
group: media
weight: '10'
---
Cloudinary is a digital asset management platform with a broad feature set, including support for responsive image generation and url based image transformation. They also provide a powerful media library UI for managing assets, and tools for organizing your assets into a hierarchy.

The Cloudinary media library integration for Netlify CMS uses Cloudinary's own media library interface within Netlify CMS. To get started, you'll need a Cloudinary account and Netlify CMS 2.2.0 or greater.

## Creating a Cloudinary Account

You can [sign up for Cloudinary](https://cloudinary.com/users/register/free) for free. Once you're logged in, you'll need to retrieve your Cloud name and API key from the upper left corner of the Cloudinary console.

![Cloudinary console screenshot](/img/cloudinary-console-details.png)

## Connecting Cloudinary to Netlify CMS

To use the Cloudinary media library within Netlify CMS, you'll need to update your Netlify CMS configuration file with the information from your Cloudinary account:

```yml
media_library:  name: cloudinary  config:    cloud_name: your_cloud_name    api_key: your_api_key
```
## Netlify CMS configuration options
The following options are specific to the Netlify CMS integration for Cloudinary:

- **`output_filename_only`**: _(default: `false`)_\
By default, the value provided for a selected image is a complete URL for the asset on Cloudinary's CDN. Setting `output_filename_only` to `true` will instead produce just the filename (e.g. `image.jpg`).
- **`use_transformations`**: _(default: `true`)_\
If `true`, uses derived url when available (the url will have image transformation segments included). Has no effect if `output_filename_only` is set to `true`.
- **`use_secure_url`**: _(default: `true`)_\
Controls whether an `http` or `https` URL is provided. Has no effect if `output_filename_only` is set to `true`.

## Cloudinary configuration options

The Cloudinary media library integration can be configured in two ways: globally, and per field. Global options will be overridden by field options. All options are listed in Cloudinary's [media library documentation](https://cloudinary.com/documentation/media_library_widget#3_set_the_configuration_options), but only the following options are available or recommended for the Netlify CMS integration:

### Authentication
* `cloud_name`
* `api_key`
* `username` _- pre-fills a username in the Cloudinary login form_

### Media library behavior
* `default_transformations` _- only the first **[image transformation]** is used_
* `max_files`
* `multiple` _- has no impact on images inside the **[markdown widget]**_

### Image transformations
Cloudinary allows multiple versions of a single image to exist via image transformations. This is especially useful for responsive images. When using this feature with Netlify CMS, you'll want to 
