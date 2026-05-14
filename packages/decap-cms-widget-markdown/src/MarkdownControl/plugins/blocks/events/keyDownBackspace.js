import { Transforms } from 'slate';

import unwrapIfCursorAtStart from '../transforms/unwrapIfCursorAtStart';
import isCursorAtStartOfNonEmptyHeading from '../locations/isCursorAtStartOfNonEmptyHeading';
import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';
import areCurrentAndPreviousBlocksOfType from '../locations/areCurrentAndPreviousBlocksOfType';
import isCursorAtStartOfBlockType from '../locations/isCursorAtStartOfBlockType';

function keyDownBackspace(editor) {
  if (!editor.selection) return;

  if (isCursorAtStartOfNonEmptyHeading(editor)) {
    return;
  }

  if (
    isCursorAtStartOfBlockType(editor, 'quote') &&
    areCurrentAndPreviousBlocksOfType(editor, 'quote')
  ) {
    Transforms.mergeNodes(editor, lowestMatchedAncestor(editor, 'quote'));
    return true;
  }

  return unwrapIfCursorAtStart(editor, true);
}

export default keyDownBackspace;
