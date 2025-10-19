import { Editor } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function areCurrentAndPreviousBlocksOfType(editor, type) {
  const { selection } = editor;
  if (!selection) return false;

  const [current] = Editor.nodes(editor, lowestMatchedAncestor(editor, 'block'));
  const previous = Editor.previous(editor, lowestMatchedAncestor(editor, type));

  return current && previous && current[0].type === previous[0].type;
}

export default areCurrentAndPreviousBlocksOfType;
