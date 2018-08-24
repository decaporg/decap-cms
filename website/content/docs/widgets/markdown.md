---
label: "Markdown"
target: markdown
---

The markdown widget provides a full fledged text editor - which is based on [slate](https://github.com/ianstormtaylor/slate) - that allows users to format text with features such as headings and blockquotes. Users are also allowed to write in markdown by simply flipping a switch.

_Please note:_ If you want to use your markdown editor to fill a markdown file contents after its frontmatter, you'll have to name the field `body` so the CMS recognizes it and saves the file accordingly.

- **Name:** `markdown`
- **UI:** full text editor
- **Data type:** markdown
- **Options:**
  - `default`: accepts markdown content
  - `buttons`: an array of strings representing the formatting buttons to display, all buttons shown by default. Buttons include: `bold`, `italic`, `code`, `link`, `heading-one`, `heading-two`, `quote`, `code-block`, `bulleted-list`, and `numbered-list`.
- **Example:**

  ```yaml
  - { label: 'Blog post content', name: 'body', widget: 'markdown' }
  ```

This would render as:

![Markdown widget example](/img/widgets-markdown.png)

_Please note:_ If you are building a site with certain static site generators, you may need to add a markdownify filter when you come to display the output. Consult with your static site generator's documentation for rendering markdown.