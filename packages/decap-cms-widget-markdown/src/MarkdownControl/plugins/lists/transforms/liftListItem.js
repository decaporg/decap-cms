import { Editor } from 'slate';

import unwrapFirstMatchedParent from './unwrapFirstMatchedParent';
import liftFirstMatchedParent from './liftFirstMatchedParent';
import getLowestAncestorList from '../selectors/getLowestAncestorList';
import getLowestAncestorQuote from '../selectors/getLowestAncestorQuote';

function liftListItem(editor) {
  Editor.withoutNormalizing(editor, () => {
    // lift the paragraph out of the list and split if necessary
    liftFirstMatchedParent(editor, 'list-item', { split: true });

    // if list is nested and not wrapped in quote, lift into the parent list, unwrap otherwise
    const parentList = getLowestAncestorList(editor);
    const parentQuote = getLowestAncestorQuote(editor);
    if (
      (parentList && !parentQuote) ||
      (parentList && parentQuote && parentList[1].length > parentQuote[1].length)
    ) {
      liftFirstMatchedParent(editor, 'list-item', { split: true });
    } else {
      // unwrap the paragraph from list-item element
      unwrapFirstMatchedParent(editor, 'list-item');
    }
  });

  Editor.normalize(editor, { force: true });
}

export default liftListItem;
