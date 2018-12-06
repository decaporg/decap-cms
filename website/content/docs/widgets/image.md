---
label: "Image"
title: image
---

The image widget allows editors to upload an image or select an existing one from the media library. The path to the image file will be saved to the field as a string.

- **Name:** `image`
- **UI:** file picker button opens media gallery allowing image files (jpg, jpeg, webp, gif, png, bmp, tiff, svg) only; displays selected image thumbnail
- **Data type:** file path string
- **Options:**
  - `default`: accepts a file path string; defaults to null
  - `media_library`: media library settings to apply when a media library is opened by the
    current widget
    - `allow_multiple`: _(default: `true`)_ when set to `false`, prevents multiple selection for any media library extension, but must be supported by the extension in use
    - `config`: a configuration object that will be passed directly to the media library being
      used - available options are determined by the library
- **Example:**
    ```yaml
    - label: "Featured Image"
      name: "thumbnail"
      widget: "image"
      default: "/uploads/chocolate-dogecoin.jpg"
      media_library:
        config:
          multiple: true
    ```
