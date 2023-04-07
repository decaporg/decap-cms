import { Editor } from 'slate';

import unwrapFirstMatchedParent from './unwrapFirstMatchedParent';
import liftFirstMatchedParent from './liftFirstMatchedParent';

function liftListItem(editor) {
  Editor.withoutNormalizing(editor, () => {
    // lift the paragraph out of the list and split if necessary
    liftFirstMatchedParent(editor, 'list-item', { split: true });
    // unwrap the paragraph from list-item element
    unwrapFirstMatchedParent(editor, 'list-item');
  });

  Editor.normalize(editor, { force: true });
}

export default liftListItem;
