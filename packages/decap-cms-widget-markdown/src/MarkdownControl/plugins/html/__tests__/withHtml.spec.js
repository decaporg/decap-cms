import { Transforms } from 'slate';

import withHtml from '../withHtml';

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
          { type: 'image', url: 'https://example.com/image.png', children: [{ text: '' }] },
        ],
      },
    ]);
  });
});
