---
title: file
label: File
description: >-
  The file widget allows editors to upload a file or select an existing one from
  the media library. The path to the file will be saved to the field as a
  string.
ui: file picker button opens media gallery
data_type: 'file path string, based on `media_folder`/`public_folder` configuration'
options:
  - description: accepts a file path string; defaults to null
    name: default
examples:
  - content: |-
      ```yaml
      - label: "Manual PDF"
        name: "manual_pdf"
        widget: "file"
        default: "/uploads/general-manual.pdf"
      ```
---

