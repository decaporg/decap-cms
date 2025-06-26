import React from 'react';
import { render, screen } from '@testing-library/react';
import padStart from 'lodash/padStart';
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

        const { container } = render(
          <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
        );
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('H2');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('H3');
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('H4');
        expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('H5');
        expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('H6');
        expect(container).toHaveTextContent('Text with bold & em elements');
        expect(screen.getByRole('link', { name: 'link title' })).toHaveAttribute(
          'href',
          'http://google.com',
        );
        expect(screen.getAllByRole('img').length).toBe(2);
      });
    });

    describe('Headings', () => {
      for (const heading of [...Array(6).keys()]) {
        it(`should render Heading ${heading + 1}`, async () => {
          const value = padStart(' Title', heading + 7, '#');
          const html = await markdownToHtml(value);

          render(<MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />);
          expect(screen.getByRole('heading', { level: heading + 1 })).toHaveTextContent('Title');
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

        const { container } = render(
          <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
        );
        // Check for ordered and unordered lists
        expect(container.querySelectorAll('ol').length).toBeGreaterThan(0);
        expect(container.querySelectorAll('ul').length).toBeGreaterThan(0);
        expect(screen.getByText('ol item 1')).toBeInTheDocument();
        expect(screen.getByText('Sublist 1')).toBeInTheDocument();
        expect(screen.getByText('Sub-Sublist 1')).toBeInTheDocument();
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

        render(<MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />);
        expect(screen.getByRole('link', { name: 'Google' })).toHaveAttribute(
          'href',
          'http://google.com/',
        );
        expect(screen.getByRole('link', { name: 'Yahoo' })).toHaveAttribute(
          'href',
          'http://search.yahoo.com/',
        );
        expect(screen.getByRole('link', { name: 'MSN' })).toHaveAttribute(
          'href',
          'http://search.msn.com/',
        );
      });
    });

    describe('Code', () => {
      it('should render code', async () => {
        const value = 'Use the `printf()` function.';
        const html = await markdownToHtml(value);

        const { container } = render(
          <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
        );
        expect(container.querySelector('code')).toHaveTextContent('printf()');
      });

      it('should render code 2', async () => {
        const value = '``There is a literal backtick (`) here.``';
        const html = await markdownToHtml(value);

        const { container } = render(
          <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
        );
        expect(container.querySelector('code')).toHaveTextContent(
          'There is a literal backtick (`) here.',
        );
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

        const { container } = render(
          <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
        );
        expect(container.querySelector('form')).toBeInTheDocument();
        expect(container.querySelector('dl')).toBeInTheDocument();
        expect(container.querySelector('h1[style]')).toHaveTextContent('Test');
      });
    });
  });

  describe('HTML rendering', () => {
    it('should render HTML', async () => {
      const value = '<p>Paragraph with <em>inline</em> element</p>';
      const html = await markdownToHtml(value);

      const { container } = render(
        <MarkdownPreview value={html} getAsset={jest.fn()} resolveWidget={jest.fn()} />,
      );
      expect(container.querySelector('p')).toHaveTextContent('Paragraph with inline element');
      expect(container.querySelector('em')).toHaveTextContent('inline');
    });
  });

  describe('HTML sanitization', () => {
    it('should sanitize HTML', async () => {
      const value = `<img src="foobar.png" onerror="alert('hello')">`;
      const field = Map({ sanitize_preview: true });

      const { container } = render(
        <MarkdownPreview
          value={value}
          getAsset={jest.fn()}
          resolveWidget={jest.fn()}
          field={field}
        />,
      );
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', 'foobar.png');
      expect(img).not.toHaveAttribute('onerror');
    });

    it('should not sanitize HTML', async () => {
      const value = `<img src="foobar.png" onerror="alert('hello')">`;
      const field = Map({ sanitize_preview: false });

      const { container } = render(
        <MarkdownPreview
          value={value}
          getAsset={jest.fn()}
          resolveWidget={jest.fn()}
          field={field}
        />,
      );
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', 'foobar.png');
      expect(img).toHaveAttribute('onerror', "alert('hello')");
    });
  });
});
