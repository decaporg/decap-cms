---
label: "Image"
target: "image"
---

### Image

The image widget allows editors to upload an image or select an existing one from the media library. The path to the image file will be saved to the field as a string.

- **Name:** `image`
- **UI:** file picker button opens media gallery allowing image files (jpg, jpeg, webp, gif, png, bmp, tiff, svg) only; displays selected image thumbnail
- **Data type:** file path string, based on `media_folder`/`public_folder` configuration
- **Options:**
  - `default`: accepts a file path string; defaults to null
- **Example:**

  ```yaml
  - label: "Featured Image"
    name: "thumbnail"
    widget: "image"
    default: "/uploads/chocolate-dogecoin.jpg"
  ```