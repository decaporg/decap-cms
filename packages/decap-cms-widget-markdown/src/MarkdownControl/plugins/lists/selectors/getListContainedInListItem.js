import { Editor } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function getListContainedInListItem(editor) {
  if (!editor.selection) return false;

  const [, paragraphPath] = Editor.above(editor, lowestMatchedAncestor(editor, 'paragraph'));
  return Editor.next(editor, { at: paragraphPath });
}

export default getListContainedInListItem;
