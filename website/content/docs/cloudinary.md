---
title: Cloudinary
group: media
weight: '10'
---
Cloudinary is a digital asset management platform with a broad feature set, including support for responsive image generation and url based image transformation. They also provide a powerful media library UI for managing assets, and tools for organizing your assets into a hierarchy.

The Cloudinary media library integration for Netlify CMS uses Cloudinary's own media library interface within Netlify CMS. To get started, you'll need a Cloudinary account and Netlify CMS 2.3.0 or greater.

## Creating a Cloudinary Account

You can [sign up for Cloudinary](https://cloudinary.com/users/register/free) for free. Once you're logged in, you'll need to retrieve your Cloud name and API key from the upper left corner of the Cloudinary console.

![Cloudinary console screenshot](/img/cloudinary-console-details.png)

## Connecting Cloudinary to Netlify CMS

To use the Cloudinary media library within Netlify CMS, you'll need to update your Netlify CMS configuration file with the information from your Cloudinary account:

```yml
media_library:
  name: cloudinary
  config:
    cloud_name: your_cloud_name
    api_key: your_api_key
```

## Netlify CMS configuration options

The following options are specific to the Netlify CMS integration for Cloudinary:

* **`output_filename_only`**: _(default: `false`)_\
  By default, the value provided for a selected image is a complete URL for the asset on Cloudinary's CDN. Setting `output_filename_only` to `true` will instead produce just the filename (e.g. `image.jpg`).
* **`use_transformations`**: _(default: `true`)_\
  If `true`, uses derived url when available (the url will have image transformation segments included). Has no effect if `output_filename_only` is set to `true`.
* **`use_secure_url`**: _(default: `true`)_\
  Controls whether an `http` or `https` URL is provided. Has no effect if `output_filename_only` is set to `true`.

## Cloudinary configuration options

The Cloudinary media library integration can be configured in two ways: globally and per field. Global options will be overridden by field options. All options are listed in Cloudinary's [media library documentation](https://cloudinary.com/documentation/media_library_widget#3_set_the_configuration_options), but only the following options are available or recommended for the Netlify CMS integration:

### Authentication

* `cloud_name`
* `api_key`
* `username` _\- pre-fills a username in the Cloudinary login form_

### Media library behavior

* `default_transformations` _\- only the first [image transformation](#image-transformations) is used, be sure to use the `Library` column transformation names from the_ [_transformation reference_]("https://cloudinary.com/documentation/image_transformation_reference")
* `max_files`
* `multiple` _\- has no impact on images inside the [markdown widget](/docs/widgets/#markdown)_

## Image transformations

The Cloudinary integration allows images to be transformed in two ways: directly within Netlify CMS, and separately from the CMS via Cloudinary's [dynamic URL's](https://cloudinary.com/documentation/image_transformations#delivering_media_assets_using_dynamic_urls). If you transform images within the Cloudinary media library, the transformed image URL will be output by default. This gives the editor complete freedom to make changes to the image output.

## Art direction and responsive images

If you prefer to provide art direction so that images are transformed in a specific way, or dynamically retrieve images based on viewport size, you can do so by providing your own base Cloudinary URL and only storing the asset filenames in your content:

1. Either globally or for specific fields, configure the Cloudinary extension to only output the asset filename:

```yml
# global
media_library:
  name: cloudinary
  output_filename_only: true

# field
fields:
  - { name: image, widget: image, media_library: { output_filename_only: true } }
```

2. Provide a dynamic URL in the site template where the image is used:

```hbs
{{! handlebars example }}

<img src="https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<version>/<transformations>/{{image}}"/>
```

Your dynamic URL can be formed conditionally to provide any desired transformations - please see Cloudinary's [image transformation reference](https://cloudinary.com/documentation/image_transformation_reference) for available transformations.
