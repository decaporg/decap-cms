import { Editor } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function getListTypeAtCursor(editor) {
  const list = Editor.above(editor, lowestMatchedAncestor(editor, 'list'));
  if (!list) return null;
  return list[0].type;
}

export default getListTypeAtCursor;
