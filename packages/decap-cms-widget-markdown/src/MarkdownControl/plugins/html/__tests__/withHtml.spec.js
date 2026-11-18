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
});
