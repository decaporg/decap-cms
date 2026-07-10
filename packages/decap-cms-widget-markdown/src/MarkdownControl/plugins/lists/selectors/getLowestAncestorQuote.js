import { Editor } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function getLowestAncestorQuote(editor) {
  if (!editor.selection) return false;

  return Editor.above(editor, lowestMatchedAncestor(editor, 'quote'));
}

export default getLowestAncestorQuote;
