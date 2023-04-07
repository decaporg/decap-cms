import { Editor, Transforms } from 'slate';

import matchedAncestors from '../matchers/matchedAncestors';
import lowestMatchedAncestor from '../matchers/lowestMatchedAncestor';

function keyDownShiftTab(editor) {
  if (!editor.selection) return;

  if (Array.from(Editor.nodes(editor, matchedAncestors('list'))).length < 2) {
    return;
  }

  Editor.withoutNormalizing(editor, () => {
    Transforms.liftNodes(editor, {
      ...lowestMatchedAncestor('list-item'),
      split: true,
    });
    Transforms.liftNodes(editor, {
      ...lowestMatchedAncestor('list-item'),
      split: true,
    });
  });

  Editor.normalize(editor);
}

export default keyDownShiftTab;
