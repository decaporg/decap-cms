import { Transforms } from 'slate';

import withHtml from '../withHtml';
import { slateToMarkdown } from '../../../../serializers';

describe('withHtml', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createEditor() {
    return {
      insertData: jest.fn(),
      isInline: jest.fn(() => false),
      isVoid: jest.fn(() => false),
    };
  }

  function createDataTransfer(html) {
    return {
      getData: jest.fn(type => (type === 'text/html' ? html : '')),
    };
  }

  it('should unwrap links with dangerous protocols', () => {
    const editor = withHtml(createEditor());
    const insertFragmentSpy = jest.spyOn(Transforms, 'insertFragment').mockImplementation(() => {});

    editor.insertData(createDataTransfer('<p><a href="javascript:alert(1)">click me</a></p>'));

    expect(insertFragmentSpy).toHaveBeenCalledWith(editor, [
      {
        type: 'paragraph',
        children: [{ text: 'click me' }],
      },
    ]);
  });

  it('should drop images with dangerous protocols', () => {
    const editor = withHtml(createEditor());
    const insertFragmentSpy = jest.spyOn(Transforms, 'insertFragment').mockImplementation(() => {});

    editor.insertData(createDataTransfer('<p>before<img src="javascript:alert(1)">after</p>'));

    expect(insertFragmentSpy).toHaveBeenCalledWith(editor, [
      {
        type: 'paragraph',
        children: [{ text: 'beforeafter' }],
      },
    ]);
  });

  it('should keep safe image URLs', () => {
    const editor = withHtml(createEditor());
    const insertFragmentSpy = jest.spyOn(Transforms, 'insertFragment').mockImplementation(() => {});

    editor.insertData(createDataTransfer('<p><img src="https://example.com/image.png"></p>'));

    expect(insertFragmentSpy).toHaveBeenCalledWith(editor, [
      {
        type: 'paragraph',
        children: [
          {
            type: 'image',
            data: { url: 'https://example.com/image.png' },
            children: [{ text: '' }],
          },
        ],
      },
    ]);
  });

  it('should keep image alt and title so pasted images can be serialized', () => {
    const editor = withHtml(createEditor());
    const insertFragmentSpy = jest.spyOn(Transforms, 'insertFragment').mockImplementation(() => {});

    editor.insertData(
      createDataTransfer(
        '<p>text</p><p><img src="https://example.com/image.png" alt="An image" title="Title"></p>',
      ),
    );

    const fragment = insertFragmentSpy.mock.calls[0][1];
    expect(fragment[1].children[0]).toEqual({
      type: 'image',
      data: { url: 'https://example.com/image.png', alt: 'An image', title: 'Title' },
      children: [{ text: '' }],
    });
    expect(slateToMarkdown(fragment)).toBe(
      'text\n\n![An image](https://example.com/image.png "Title")',
    );
  });

  describe('line breaks in pasted html (#8094)', () => {
    function paste(html) {
      const editor = withHtml(createEditor());
      const insertFragmentSpy = jest
        .spyOn(Transforms, 'insertFragment')
        .mockImplementation(() => {});
      editor.insertData(createDataTransfer(html));
      const { calls } = insertFragmentSpy.mock;
      return calls[calls.length - 1][1];
    }

    it('should keep words separated when a line break replaces the space', () => {
      expect(paste('<p>first\r\nsecond words</p>')).toEqual([
        { type: 'paragraph', children: [{ text: 'first second words' }] },
      ]);
      expect(paste('<p>first\nsecond</p>')).toEqual([
        { type: 'paragraph', children: [{ text: 'first second' }] },
      ]);
    });

    it('should keep a line break between inline elements as a space', () => {
      const fragment = paste('<p><span>first</span>\r\n<span>second</span></p>');
      expect(slateToMarkdown(fragment)).toBe('first second');
    });

    it('should not add whitespace around blocks (#7364)', () => {
      const fragment = paste('<body>\r\n<p>one</p>\r\n<p>two\r\n</p>\r\n</body>');
      expect(slateToMarkdown(fragment)).toBe('one\n\ntwo');
    });

    it('should keep line breaks in code blocks', () => {
      const fragment = paste('<pre><code>const a = 1;\nconst b = 2;</code></pre>');
      expect(fragment[0].children[0].text).toBe('const a = 1;\nconst b = 2;');
    });
  });
});
