import { Editor, Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function unwrapIfCursorAtStart(editor, mergeWithPrevious = false) {
  if (editor.selection.anchor.offset !== 0) return false;

  let [node, path] = Editor.above(editor, lowestMatchedAncestor(editor, 'non-default'));

  if (path.length == 0) return false;

  const isHeading = `${node.type}`.startsWith('heading-');
  if (isHeading) {
    Transforms.setNodes(editor, { type: 'paragraph' });
    return false;
  }

  const isBlock = Editor.isBlock(editor, node);
  const [parentBlock, parentBlockPath] = Editor.above(
    editor,
    lowestMatchedAncestor(editor, 'block'),
  );
  if (!isBlock) {
    if (!Editor.isStart(editor, path, parentBlockPath)) {
      return false;
    }

    [node, path] = [parentBlock, parentBlockPath];
  }

  Editor.withoutNormalizing(editor, () => {
    Transforms.unwrapNodes(editor, { match: n => n.type === node.type, split: true });

    if (mergeWithPrevious) {
      Transforms.mergeNodes(editor);
    }
  });

  Editor.normalize(editor, { force: true });
  return true;
}

export default unwrapIfCursorAtStart;
