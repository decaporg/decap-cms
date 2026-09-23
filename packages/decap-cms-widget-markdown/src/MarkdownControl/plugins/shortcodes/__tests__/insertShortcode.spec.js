import { createEditor, Editor, Transforms } from 'slate';
import { withReact } from 'slate-react';

import withShortcodes from '../withShortcodes';
import insertShortcode from '../insertShortcode';

function makeEditor(
  initialChildren = [{ type: 'paragraph', children: [{ text: 'Sample text' }] }],
) {
  const editor = withReact(withShortcodes(createEditor()));
  editor.children = initialChildren;
  return editor;
}

describe('insertShortcode', () => {
  it('should insert inline shortcode with onInsert resolving data', async () => {
    const editor = makeEditor();
    editor.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 6 },
    }; // Selected "Sample"

    const onInsertMock = jest.fn().mockResolvedValue({ target: 'doc-page', label: 'Sample' });

    const pluginConfig = {
      id: 'wikilink',
      type: 'inline',
      onInsert: onInsertMock,
    };

    await insertShortcode(editor, pluginConfig, { contextKey: 'val' });

    expect(onInsertMock).toHaveBeenCalledWith({
      selectedText: 'Sample',
      cmsContext: { contextKey: 'val' },
    });

    const insertedNode = editor.children[0].children.find(
      child => child.type === 'inline-shortcode',
    );
    expect(insertedNode).toBeDefined();
    expect(insertedNode.data).toEqual({
      shortcode: 'wikilink',
      shortcodeNew: true,
      shortcodeData: { target: 'doc-page', label: 'Sample' },
      isVoid: true,
    });
  });

  it('should cancel inline shortcode insertion when onInsert resolves null', async () => {
    const editor = makeEditor();
    editor.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 6 },
    };

    const onInsertMock = jest.fn().mockResolvedValue(null);

    const pluginConfig = {
      id: 'wikilink',
      type: 'inline',
      onInsert: onInsertMock,
    };

    await insertShortcode(editor, pluginConfig);

    expect(onInsertMock).toHaveBeenCalled();
    const insertedNode = editor.children[0].children.find(
      child => child.type === 'inline-shortcode',
    );
    expect(insertedNode).toBeUndefined();
  });

  it('should insert at the captured selection after onInsert changes focus', async () => {
    const editor = makeEditor();
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 6 },
    });
    let resolveInsert;
    const onInsert = jest.fn(
      () =>
        new Promise(resolve => {
          resolveInsert = resolve;
        }),
    );

    const insertion = insertShortcode(editor, {
      id: 'wikilink',
      type: 'inline',
      onInsert,
    });
    Transforms.select(editor, { path: [0, 0], offset: 11 });
    resolveInsert({ target: 'doc-page' });
    await insertion;

    expect(editor.children[0].children[1].type).toBe('inline-shortcode');
    expect(Editor.string(editor, [0])).toBe(' text');
  });

  it('should keep inline shortcodes atomic when isVoid is false', () => {
    const editor = makeEditor();

    expect(editor.isVoid({ type: 'inline-shortcode', data: { isVoid: false } })).toBe(true);
  });
});
