import { Editor } from 'slate';

import liftFirstMatchedParent from './liftFirstMatchedParent';
import wrapFirstMatchedParent from './wrapFirstMatchedParent';

function convertParagraphToListItem(editor) {
  Editor.withoutNormalizing(editor, () => {
    // wrap the paragraph in a list item
    wrapFirstMatchedParent(editor, 'paragraph', {
      type: 'list-item',
    });
    // lift the new list-item of the current list-item, split if necessary
    liftFirstMatchedParent(editor, 'list-item', { split: true });
  });

  Editor.normalize(editor, { force: true });
}

export default convertParagraphToListItem;
