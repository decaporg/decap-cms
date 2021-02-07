import React from 'react';
import { create, act } from 'react-test-renderer';
import { padStart } from 'lodash';
import { Map } from 'immutable';
import MarkdownPreview from '../MarkdownPreview';
import { markdownToHtml } from '../serializers';

describe('Markdown Preview renderer', () => {
  describe('Markdown rendering', () => {
    describe('General', () => {
      it('should render markdown', async () => {
        const value = `
# H1

Text with **bold** & _em_ elements

## H2

* ul item 1
* ul item 2

### H3

1. ol item 1
1. ol item 2
1. ol item 3

#### H4

[link title](http://google.com)

##### H5

![alt text](https://pbs.twimg.com/profile_images/678903331176214528/TQTdqGwD.jpg)

###### H6

![](https://pbs.twimg.com/profile_images/678903331176214528/TQTdqGwD.jpg)
`;
        const html = await markdownToHtml(value);

        let root;
        await act(async () => {
          root = create(
            <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
          );
        });

        expect(root.toJSON()).toMatchSnapshot();
      });
    });

    describe('Headings', () => {
      for (const heading of [...Array(6).keys()]) {
        it(`should render Heading ${heading + 1}`, async () => {
          const value = padStart(' Title', heading + 7, '#');
          const html = await markdownToHtml(value);

          let root;
          await act(async () => {
            root = create(
              <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
            );
          });

          expect(root.toJSON()).toMatchSnapshot();
        });
      }
    });

    describe('Lists', () => {
      it('should render lists', async () => {
        const value = `
1. ol item 1
1. ol item 2
    * Sublist 1
    * Sublist 2
    * Sublist 3
        1. Sub-Sublist 1
        1. Sub-Sublist 2
        1. Sub-Sublist 3
1. ol item 3
`;
        const html = await markdownToHtml(value);

        let root;
        await act(async () => {
          root = create(
            <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
          );
        });

        expect(root.toJSON()).toMatchInlineSnapshot(`
.emotion-0 {
  margin: 15px 2px;
}

<div
  className="emotion-0 emotion-1"
  dangerouslySetInnerHTML={
    Object {
      "__html": "<ol>
<li>ol item 1</li>
<li>ol item 2<ul>
<li>Sublist 1</li>
<li>Sublist 2</li>
<li>Sublist 3<ol>
<li>Sub-Sublist 1</li>
<li>Sub-Sublist 2</li>
<li>Sub-Sublist 3</li>
</ol></li>
</ul></li>
<li>ol item 3</li>
</ol>",
    }
  }
/>
`);
      });
    });

    describe('Links', () => {
      it('should render links', async () => {
        const value = `
I get 10 times more traffic from [Google] than from [Yahoo] or [MSN].

  [Google]: http://google.com/        "Google"
  [Yahoo]: http://search.yahoo.com/  "Yahoo Search"
  [MSN]: http://search.msn.com/    "MSN Search"
`;
        const html = await markdownToHtml(value);

        let root;
        await act(async () => {
          root = create(
            <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
          );
        });

        expect(root.toJSON()).toMatchSnapshot();
      });
    });

    describe('Code', () => {
      it('should render code', async () => {
        const value = 'Use the `printf()` function.';
        const html = await markdownToHtml(value);

        let root;
        await act(async () => {
          root = create(
            <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
          );
        });

        expect(root.toJSON()).toMatchSnapshot();
      });

      it('should render code 2', async () => {
        const value = '``There is a literal backtick (`) here.``';
        const html = await markdownToHtml(value);

        let root;
        await act(async () => {
          root = create(
            <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
          );
        });

        expect(root.toJSON()).toMatchSnapshot();
      });
    });

    describe('HTML', () => {
      it('should render HTML as is when using Markdown', async () => {
        const value = `
# Title

<form action="test">
  <label for="input">
    <input type="checkbox" checked="checked" id="input"/> My label
  </label>
  <dl class="test-class another-class" style="width: 100%">
      <dt data-attr="test">Test HTML content</dt>
      <dt>Testing HTML in Markdown</dt>
  </dl>
</form>

<h1 style="display: block; border: 10px solid #f00; width: 100%">Test</h1>
`;
        const html = await markdownToHtml(value);

        let root;
        await act(async () => {
          root = create(
            <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
          );
        });

        expect(root.toJSON()).toMatchSnapshot();
      });
    });
  });

  describe('HTML rendering', () => {
    it('should render HTML', async () => {
      const value = '<p>Paragraph with <em>inline</em> element</p>';
      const html = await markdownToHtml(value);

      let root;
      await act(async () => {
        root = create(
          <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
        );
      });

      expect(root.toJSON()).toMatchSnapshot();
    });
  });

  describe('HTML sanitization', () => {
    it('should sanitize HTML', async () => {
      const value = `<img src="foobar.png" onerror="alert('hello')">`;
      const field = Map({ sanitize_preview: true });

      let root;
      await act(async () => {
        root = create(
          <MarkdownPreview
            value={value}
            getAsset={jest.fn()}
            resolveWidget={jest.fn()}
            field={field}
          />,
        );
      });

      expect(root.toJSON()).toMatchSnapshot();
    });

    it('should not sanitize HTML', async () => {
      const value = `<img src="foobar.png" onerror="alert('hello')">`;
      const field = Map({ sanitize_preview: false });

      let root;
      await act(async () => {
        root = create(
          <MarkdownPreview
            value={value}
            getAsset={jest.fn()}
            resolveWidget={jest.fn()}
            field={field}
          />,
        );
      });

      expect(root.toJSON()).toMatchSnapshot();
    });
  });
});
