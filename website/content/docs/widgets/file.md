---
label: "File"
target: file
---

The file widget allows editors to upload a file or select an existing one from the media library. The path to the file will be saved to the field as a string.

- **Name:** `file`
- **UI:** file picker button opens media gallery
- **Data type:** file path string, based on `media_folder`/`public_folder` configuration
- **Options:**
  - `default`: accepts a file path string; defaults to null
- **Example:**
    ```yaml
    - label: "Manual PDF"
      name: "manual_pdf"
      widget: "file"
      default: "/uploads/general-manual.pdf"
    ```
