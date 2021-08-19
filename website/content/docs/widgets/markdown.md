---
title: markdown
label: Markdown
---
The markdown widget provides a full fledged text editor allowing users to format text with features such as headings and blockquotes. Users can change their editing view with a handy toggle button. 

*Please note:* If you want to use your markdown editor to fill a markdown file contents after its frontmatter, you'll have to name the field `body` so the CMS recognizes it and saves the file accordingly.

* **Name:** `markdown`
* **UI:** full text editor
* **Data type:** markdown
* **Options:**

  * `default`: accepts markdown content
  * `minimal`: accepts a boolean value, `false` by default. Sets the widget height to minimum possible.
  * `buttons`: an array of strings representing the formatting buttons to display (all shown by default). Buttons include: `bold`, `italic`, `code`, `link`, `heading-one`, `heading-two`, `heading-three`, `heading-four`, `heading-five`, `heading-six`, `quote`, `bulleted-list`, and `numbered-list`.
  * `editor_components`: an array of strings representing the names of editor components to display (all shown by default). Netlify CMS includes `image` and `code-block` editor components by default, and custom components may be [created and registered](/docs/custom-widgets/#registereditorcomponent).
  * `modes`: an array of strings representing the names of allowed editor modes. Possible modes are `raw` and `rich_text`. A toggle button appears in the toolbar when more than one mode is available.
  * `sanitize_preview`: accepts a boolean value, `false` by default. Sanitizes markdown preview to prevent XSS attacks - might alter the preview content.
* **Example:**

  ```yaml
  - { label: 'Blog post content', name: 'body', widget: 'markdown' }
  ```

This would render as:

![Markdown widget example](/img/widgets-markdown.png)

*Please note:* The markdown widget outputs a raw markdown string. Your static site generator may or may not render the markdown to HTML automatically. Consult with your static site generator's documentation for more information about rendering markdown.
