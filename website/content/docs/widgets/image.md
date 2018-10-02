---
title: image
label: Image
description: >-
  The image widget allows editors to upload an image or select an existing one
  from the media library. The path to the image file will be saved to the field
  as a string.
ui: >-
  file picker button opens media gallery allowing image files (jpg, jpeg, webp,
  gif, png, bmp, tiff, svg) only; displays selected image thumbnail
data_type: 'file path string, based on `media_folder`/`public_folder` configuration'
options:
  - description: accepts a file path string; defaults to null
    name: default
  - description: >-
      - `media_library`: media library settings to apply when a media library is
      opened by the current widget
        - `config`: a configuration object that will be passed directly to the media library being used - available options are determined by the library
    name: options
examples:
  - content: |-
      ```yaml
        - label: "Featured Image"
          name: "thumbnail"
          widget: "image"
          default: "/uploads/chocolate-dogecoin.jpg"
          options:
            media_library:
              config:
                publicKey: "demopublickey"
                multiple: true
      ```
---

