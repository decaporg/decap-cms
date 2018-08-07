import { markdownToSlate } from '../../serializers';

const parser = markdownToSlate;

describe('Compile markdown to Slate Raw AST', () => {
  it('should compile simple markdown', () => {
    const value = `
# H1

sweet body
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile a markdown ordered list', () => {
    const value = `
# H1

1. yo
2. bro
3. fro
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile bulleted lists', () => {
    const value = `
# H1

* yo
* bro
* fro
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile multiple header levels', () => {
    const value = `
# H1

## H2

### H3
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile horizontal rules', () => {
    const value = `
# H1

---

blue moon
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile horizontal rules', () => {
    const value = `
# H1

---

blue moon
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile soft breaks (double space)', () => {
    const value = `
blue moon  
footballs
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile images', () => {
    const value = `
![super](duper.jpg)
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile code blocks', () => {
    const value = `
\`\`\`javascript
var a = 1;
\`\`\`
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile nested inline markup', () => {
    const value = `
# Word

This is **some *hot* content**

perhaps **scalding** even
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile inline code', () => {
    const value = `
# Word

This is some sweet \`inline code\` yo!
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile links', () => {
    const value = `
# Word

How far is it to [Google](https://google.com) land?
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile plugins', () => {
    const value = `
![test](test.png)

{{< test >}}
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it('should compile kitchen sink example', () => {
    const value = `
# An exhibit of Markdown

This note demonstrates some of what Markdown is capable of doing.

*Note: Feel free to play with this page. Unlike regular notes, this doesn't
automatically save itself.*

## Basic formatting

Paragraphs can be written like so. A paragraph is the basic block of Markdown.
A paragraph is what text will turn into when there is no reason it should
become anything else.

Paragraphs must be separated by a blank line. Basic formatting of *italics* and
**bold** is supported. This *can be **nested** like* so.

## Lists

### Ordered list

1. Item 1 2. A second item 3. Number 3 4. Ⅳ

*Note: the fourth item uses the Unicode character for Roman numeral four.*

### Unordered list

* An item Another item Yet another item And there's more...

## Paragraph modifiers

### Code block

    Code blocks are very useful for developers and other people who look at
    code or other things that are written in plain text. As you can see, it
    uses a fixed-width font.

You can also make \`inline code\` to add code into other things.

### Quote

> Here is a quote. What this is should be self explanatory. Quotes are
automatically indented when they are used.

## Headings

There are six levels of headings. They correspond with the six levels of HTML
headings. You've probably noticed them already in the page. Each level down
uses one more hash character.

### Headings *can* also contain **formatting**

### They can even contain \`inline code\`

Of course, demonstrating what headings look like messes up the structure of the
page.

I don't recommend using more than three or four levels of headings here,
because, when you're smallest heading isn't too small, and you're largest
heading isn't too big, and you want each size up to look noticeably larger and
more important, there there are only so many sizes that you can use.

## URLs

URLs can be made in a handful of ways:

* A named link to MarkItDown. The easiest way to do these is to select what you
* want to make a link and hit \`Ctrl+L\`.  Another named link to
* [MarkItDown](http://www.markitdown.net/) Sometimes you just want a URL like
* <http://www.markitdown.net/>.

## Horizontal rule

A horizontal rule is a line that goes across the middle of the page.

---

It's sometimes handy for breaking things up.

## Images

Markdown can also contain images. I'll need to add something here sometime.

## Finally

There's actually a lot more to Markdown than this. See the official
introduction and syntax for more information. However, be aware that this is
not using the official implementation, and this might work subtly differently
  in some of the little things.
`;
    expect(parser(value)).toMatchSnapshot();
  });
});
