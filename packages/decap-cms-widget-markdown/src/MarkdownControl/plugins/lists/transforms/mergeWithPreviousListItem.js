import { Editor, Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function mergeWithPreviousListItem(editor) {
  Editor.withoutNormalizing(editor, () => {
    Transforms.mergeNodes(editor, lowestMatchedAncestor(editor, 'list-item'));
  });

  Editor.normalize(editor, { force: true });
}

export default mergeWithPreviousListItem;
