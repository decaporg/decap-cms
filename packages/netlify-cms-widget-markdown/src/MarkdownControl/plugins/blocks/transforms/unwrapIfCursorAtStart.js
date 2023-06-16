import { Editor, Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function unwrapIfCursorAtStart(editor, mergeWithPrevious = false) {
  if (editor.selection.anchor.offset !== 0) return false;

  const node = Editor.above(editor, lowestMatchedAncestor(editor, 'non-default'));

  if (node[1].length == 0) return false;

  const isHeading = `${node[0].type}`.startsWith('heading-');
  if (isHeading) {
    Transforms.setNodes(editor, { type: 'paragraph' });
    return false;
  }

  Editor.withoutNormalizing(editor, () => {
    Transforms.unwrapNodes(editor, { match: n => n.type === node[0].type, split: true });

    if (mergeWithPrevious) {
      Transforms.mergeNodes(editor);
    }
  });

  Editor.normalize(editor, { force: true });
  return true;
}

export default unwrapIfCursorAtStart;
