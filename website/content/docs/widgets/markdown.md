---
label: 'Markdown'
title: markdown
---

The markdown widget provides a full fledged text editor - which is based on [slate](https://github.com/ianstormtaylor/slate) - that allows users to format text with features such as headings and blockquotes. Users are also allowed to write in markdown by simply flipping a switch.

_Please note:_ If you want to use your markdown editor to fill a markdown file contents after its frontmatter, you'll have to name the field `body` so the CMS recognizes it and saves the file accordingly.

- **Name:** `markdown`
- **UI:** full text editor
- **Data type:** markdown
- **Options:**
  - `default`: accepts markdown content
  - `minimal`: accepts a boolean value, `false` by default. Sets the widget height to minimum possible.
  - `buttons`: an array of strings representing the formatting buttons to display (all shown by default). Buttons include: `bold`, `italic`, `code`, `link`, `heading-one`, `heading-two`, `heading-three`, `heading-four`, `heading-five`, `heading-six`, `quote`, `bulleted-list`, and `numbered-list`.
  - `editorComponents`: an array of strings representing the names of editor components to display (all shown by default). The `image` and `code-block` editor components are included with Netlify CMS by default, but others may be [created and registered](/docs/custom-widgets/#registereditorcomponent).
- **Example:**

  ```yaml
  - { label: 'Blog post content', name: 'body', widget: 'markdown' }
  ```

This would render as:

![Markdown widget example](/img/widgets-markdown.png)

_Please note:_ The markdown widget outputs a raw markdown string. Your static site generator may or may not render the markdown to HTML automatically. Consult with your static site generator's documentation for more information about rendering markdown.
