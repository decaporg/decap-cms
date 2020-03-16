---
title: Uploadcare
group: media
weight: 10
---
Uploadcare is a sleek service that allows you to upload files without worrying about maintaining a growing collection — more of an asset store than a library. Just upload when you need to, and the files are hosted on their CDN. They provide image processing controls from simple cropping and rotation to filters and face detection, and a lot more. You can check out Uploadcare's full feature set on their [website](https://uploadcare.com/).

The Uploadcare media library integration for Netlify CMS allows you to use Uploadcare as your media handler within the CMS itself. It's available by default as of our 2.1.0 release, and works in tandem with the existing file and image widgets, so using it only requires creating an Uploadcare account and updating your Netlify CMS configuration.

**Please make sure that Netlify CMS is updated to 2.1.0 or greater before proceeding.**

## Creating an Uploadcare Account

You can [sign up](https://uploadcare.com/accounts/signup/) for a free Uploadcare account to get started. Once you've signed up, go to your dashboard, select a project, and then select "API keys" from the menu on the left. The public key on the API keys page will be needed in your Netlify CMS configuration. For more info on getting your API key, visit their [walkthrough](https://uploadcare.com/docs/keys/).

## Updating Netlify CMS Configuration

The next and final step is updating your Netlify CMS configuration file:

1. Add a `media_library` property at the same level as `media_folder`, with an object as it's value.
2. In the `media_library` object, add the name of the media player under `name`.
3. Add a `config` object under name with a `publicKey` property with your Uploadcare public key as it's value.

Your `config.yml` should now include something like this (except with a real API key):

```yaml
media_library:
  name: uploadcare
  config:
    publicKey: YOUR_UPLOADCARE_PUBLIC_KEY
```

Once you've finished updating your Netlify CMS configuration, the Uploadcare widget will appear when using the image or file widgets.

**Note:** The Netlify CMS media library extensions for Uploadcare are not included in `netlify-cms-app`. If you're using `netlify-cms-app`, you'll need to [register the media libraries yourself](https://www.netlifycms.org/blog/2019/07/netlify-cms-gatsby-plugin-4-0-0#using-media-libraries-with-netlify-cms-app).

## Configuring the Uploadcare Widget

The Uploadcare widget can be configured with settings that are outlined [in their docs](https://uploadcare.com/docs/file_uploads/widget/options/). The widget itself accepts configuration through global variables and data properties on HTML elements, but with Netlify CMS you can pass configuration options directly through your `config.yml`.

**Note:** all default values described in Uploadcare's documentation also apply in the Netlify CMS integration, except for `previewStep`, which is set to `true`. This was done because the preview step provides helpful information like upload status, and provides access to image editing controls. This option can be disabled through the configuration options below.

### Global configuration

Global configuration, which is meant to affect the Uploadcare widget at all times, can be provided as seen above, under the primary `media_library` property. Settings applied here will affect every instance of the Uploadcare widget.

## Field configuration

Configuration can also be provided for individual fields that use the media library. The structure is very similar to the global configuration, except the settings are added to an individual `field`. For example:

```yaml
  ...
  fields:
    name: cover
    label: Cover Image
    widget: image
    media_library:
      config:
        multiple: true
        previewStep: false
```

## Integration settings

There are several settings that control the behavior of integration with the widget.

* `autoFilename` (`boolean`) - specify whether to add a filename to the end of the url. Example: `http://ucarecdn.com/:uuid/filename.png`
* `defaultOperations` (`string`) - specify a string added at the end of the url. This could be useful to apply a set of CDN operations to each image, for example resizing or compression. All the possible operations are listed [here](https://uploadcare.com/docs/api_reference/cdn/).

```yaml
media_library:
  name: uploadcare
  config:
    publicKey: YOUR_UPLOADCARE_PUBLIC_KEY
  settings:
    autoFilename: true
    defaultOperations: '/resize/800x600/'
```
