import { Editor, Range, Transforms } from 'slate';

import wrapFirstMatchedParent from './wrapFirstMatchedParent';

function splitToNestedList(editor, listType) {
  if (!editor.selection) return false;

  if (Range.isExpanded(editor.selection)) {
    Transforms.delete(editor);
  }

  Editor.withoutNormalizing(editor, () => {
    // split even if at the end of current text
    Transforms.splitNodes(editor, {
      always: true,
    });
    // set the new node to paragraph (to avoid splitting headings)
    Transforms.setNodes(editor, {
      type: 'paragraph',
    });
    // wrap the paragraph in a list item
    wrapFirstMatchedParent(editor, 'paragraph', {
      type: 'list-item',
    });
    wrapFirstMatchedParent(editor, 'list-item', {
      type: listType,
    });
  });

  Editor.normalize(editor, { force: true });
}

export default splitToNestedList;
