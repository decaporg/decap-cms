import { Editor, Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';
import matchedAncestors from '../../matchers/matchedAncestors';

function keyDownShiftTab(editor) {
  if (!editor.selection) return;

  if (Array.from(Editor.nodes(editor, matchedAncestors(editor, 'list'))).length < 2) {
    return;
  }

  Editor.withoutNormalizing(editor, () => {
    Transforms.liftNodes(editor, {
      ...lowestMatchedAncestor(editor, 'list-item'),
      split: true,
    });
    Transforms.liftNodes(editor, {
      ...lowestMatchedAncestor(editor, 'list-item'),
      split: true,
    });
  });

  Editor.normalize(editor);
}

export default keyDownShiftTab;
