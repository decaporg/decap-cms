---
title: image
label: Image
---
The image widget allows editors to upload an image or select an existing one from the media library. The path to the image file will be saved to the field as a string.

* **Name:** `image`
* **UI:** file picker button opens media gallery allowing image files (jpg, jpeg, webp, gif, png, bmp, tiff, svg) only; displays selected image thumbnail
* **Data type:** file path string
* **Options:**

  * `default`: accepts a file path string; defaults to null
  * `media_library`: settings to apply when opening a media library is opened by the
    current widget

    * `allow_multiple`: *(default: `true`)* when set to `false`, if the media library extension supports it, multiple selection will be disabled
    * `config`: a configuration object passed directly to the media library; check the documentation of your media library extension for available `config` options.
* **Example:**

  ```yaml
  - label: "Featured Image"
    name: "thumbnail"
    widget: "image"
    default: "/uploads/chocolate-dogecoin.jpg"
    media_library:
      config:
        multiple: true
  ```