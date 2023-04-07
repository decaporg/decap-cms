import { Editor, Transforms } from 'slate';

import isSelectionWithinNoninitialListItem from '../locations/isSelectionWithinNoninitialListItem';
import lowestMatchedAncestor from '../matchers/lowestMatchedAncestor';
import moveListToListItem from '../transforms/moveListToListItem';

function keyDownTab(editor) {
  if (!editor.selection) return;

  if (!isSelectionWithinNoninitialListItem(editor)) return;

  Editor.withoutNormalizing(editor, () => {
    // wrap selected list items into a new bulleted list
    Transforms.wrapNodes(
      editor,
      {
        type: 'bulleted-list',
      },
      lowestMatchedAncestor('list-item'),
    );

    // get the new bulleted list position
    const [, newListPath] = Editor.above(editor, lowestMatchedAncestor('list'));

    // get the new parent node (previous list item)
    const parentNode = Editor.previous(editor, {
      at: newListPath,
    });

    moveListToListItem(editor, newListPath, parentNode);
  });

  Editor.normalize(editor);
}

export default keyDownTab;
