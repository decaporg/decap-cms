---
label: "Markdown"
target: markdown
---

The markdown widget provides a full fledged text editor - which is based on [slate](https://github.com/ianstormtaylor/slate) - that allows users to format text with features such as headings and blockquotes. Users are also allowed to write in markdown by simply flipping a switch.

*Please note:* in case you want to use your markdown editor to fill a markdown's file content after the frontmatter, you'll have name the field as `body` so that the CMS can recognize it and save the file accordingly.

- **Name:** `markdown`
- **UI:** full text editor
- **Data type:** markdown
- **Options:**
  - `default`: accepts markdown content
  - `buttons`: an array of strings representing the formatting buttons to display, all buttons shown by default. Buttons include: `bold`, `italic`, `code`, `link`, `heading-one`, `heading-two`, `quote`, `code-block`, `bulleted-list`, and `numbered-list`.
- **Example:**
    ```yaml
    - {label: "Blog post content", name: "body", widget: "markdown"}
    ```
  This would render as:
  ![Markdown widget example](/img/widgets-markdown.png)
