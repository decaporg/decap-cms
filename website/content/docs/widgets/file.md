---
title: file
label: File
---
The file widget allows editors to upload a file or select an existing one from the media library. The path to the file will be saved to the field as a string.

* **Name:** `file`
* **UI:** file picker button opens media gallery
* **Data type:** file path string
* **Options:**

  * `default`: accepts a file path string; defaults to null
  * `media_library`: media library settings to apply when a media library is opened by the
    current widget

    * `allow_multiple`: *(default: `true`)* when set to `false`, prevents multiple selection for any media library extension, but must be supported by the extension in use
    * `config`: a configuration object that will be passed directly to the media library being
      used - available options are determined by the library
    * `media_folder` (Beta): file path where uploaded files will be saved specific to this control. Paths can be relative to a collection folder (e.g. `files` will add the file to a sub-folder in the collection folder) or absolute with reference to the base of the repo which needs to begin with `/` (e.g `/static/files` will save uploaded files to the `static` folder in a sub folder named `files`)
    * `choose_url`: *(default: `true`)* when set to `false`, the "Insert from URL" button will be hidden
* **Example:**

  ```yaml
  - label: "Manual PDF"
    name: "manual_pdf"
    widget: "file"
    default: "/uploads/general-manual.pdf"
    media_library:
      config:
        multiple: true
  ```
