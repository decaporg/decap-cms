---
title: Netlify CMS 2.1.0 adds external media support with Uploadcare
author: Shawn Erquhart
description: >-
  Netlify CMS 2.1.0 adds external media support with Uploadcare, allowing files
  like images and videos to be stored outside of your Git repository.
date: 2018-09-05T20:52:30.334Z
twitter_image: /img/netlify-cms-external-media-library.png
---
Storing large files in Git works great if you only have a few, and uploading plain images is fine if that's all your site needs. For everything else, great services like Cloudinary, Filestack, and Uploadcare exist to help you optimize and store images and other media files separately from the rest of your site. Our users have long been asking for a way to work with these kinds of services from within Netlify CMS, and we're happy to say that our latest release makes it possible!

Feast your eyes 😻

![Netlify CMS with external media library overlay](/img/netlify-cms-external-media-library.png)

## How it works: BYOUI (Bring Your Own UI)

Some services, like the ones mentioned above, provide portable interfaces that you can load into any website, like Uploadcare's [Widget](https://uploadcare.com/features/widget/), Cloudinary's [Media Library](https://cloudinary.com/documentation/media_library_widget), and Filestack's [Web Picker](https://www.filestack.com/docs/concepts/pickers/#web-picker). These libraries are generally created by the same folks that make the services, and are meant to optimally expose the unique functionality of each platform. As a bonus, the software is kept up to date with the service API's without our involvement.

Since we don't have to create the UI, the actual integration with Netlify CMS can be quite small, being mostly focused on showing/hiding the media interface and retrieving the URL's for any images selected.

## First Integration: Uploadcare

<div style="text-align: center">

![Uploadcare logo](/img/uc-logo-horizontal.svg)

</div>

Uploadcare came up on our radar when they built a Netlify CMS integration for their service in response to customer requests - before we made it possible, and without our assistance. They did quite a lot of work, and the result helped to show that using an external interface with Netlify CMS could work really well. Their effort also helped us form the new not-yet-public API that Netlify CMS now uses to work with external media libraries.

We're super excited to honor Uploadcare's love for Netlify CMS by launching external media handling with their service as the first integration!

## Get started today!

Here's how to start externalizing your media with Netlify CMS and Uploadcare:

1. Make sure you've [upgraded Netlify CMS](/docs/update-the-cms-version/) to at least 2.1.0.
2. Head over to Uploadcare, sign up, and get your API key ([more info](https://uploadcare.com/docs/keys/))
3. Remove the `media_folder` property from your CMS configuration file.
4. Add the following to your CMS configuration file:
   ```yaml
   media_library:
     name: uploadcare
     config:
       publicKey: demopublickey # replace with your publickey, or use this just to test
   ```

That's it! Check out [our docs](/docs/uploadcare/) for full details.

## Next up

As mentioned previously, we have more amazing providers coming soon! (Looking at you, Cloudinary 😻)

We'll also be finalizing and documenting the media library integration API so developers can build their own integrations for services that aren't on our radar. S3 anybody?

Questions or comments? Reach out [on Gitter](https://gitter.im/netlify/netlifycms).
