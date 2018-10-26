import React from 'react';
import renderer from 'react-test-renderer';
import { padStart } from 'lodash';
import MarkdownPreview from '../MarkdownPreview';
import { markdownToHtml } from '../serializers';

describe('Markdown Preview renderer', () => {
  describe('Markdown rendering', () => {
    describe('General', () => {
      it('should render markdown', () => {
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
        expect(
          renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
        ).toMatchSnapshot();
      });
    });

    describe('Headings', () => {
      for (const heading of [...Array(6).keys()]) {
        it(`should render Heading ${heading + 1}`, () => {
          const value = padStart(' Title', heading + 7, '#');
          expect(
            renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
          ).toMatchSnapshot();
        });
      }
    });

    describe('Lists', () => {
      it('should render lists', () => {
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
        expect(
          renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
        ).toMatchSnapshot();
      });
    });

    describe('Links', () => {
      it('should render links', () => {
        const value = `
I get 10 times more traffic from [Google] [1] than from [Yahoo] [2] or [MSN] [3].

  [1]: http://google.com/        "Google"
  [2]: http://search.yahoo.com/  "Yahoo Search"
  [3]: http://search.msn.com/    "MSN Search"
`;
        expect(
          renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
        ).toMatchSnapshot();
      });
    });

    describe('Code', () => {
      it('should render code', () => {
        const value = 'Use the `printf()` function.';
        expect(
          renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
        ).toMatchSnapshot();
      });

      it('should render code 2', () => {
        const value = '``There is a literal backtick (`) here.``';
        expect(
          renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
        ).toMatchSnapshot();
      });
    });

    describe('HTML', () => {
      it('should render HTML as is when using Markdown', () => {
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
        expect(
          renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
        ).toMatchSnapshot();
      });
    });
  });

  describe('HTML rendering', () => {
    it('should render HTML', () => {
      const value = '<p>Paragraph with <em>inline</em> element</p>';
      expect(
        renderer.create(<MarkdownPreview value={markdownToHtml(value)} />).toJSON(),
      ).toMatchSnapshot();
    });
  });
});
