import { Editor, Transforms } from 'slate';

import isSelectionWithinNoninitialListItem from '../locations/isSelectionWithinNoninitialListItem';
import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';
import moveListToListItem from '../transforms/moveListToListItem';

function keyDownTab(editor) {
  if (!editor.selection) return;

  if (!isSelectionWithinNoninitialListItem(editor)) return;

  // In a case where one edge of the range is within a nested list item, we need to even the selection to the outer most level
  const { focus, anchor } = editor.selection;

  const pathLength =
    focus.path.length > anchor.path.length ? anchor.path.length : focus.path.length;
  const at = {
    anchor: {
      offset: 0,
      path: [...anchor.path.slice(0, pathLength - 2), 0, 0],
    },
    focus: {
      offset: 0,
      path: [...focus.path.slice(0, pathLength - 2), 0, 0],
    },
  };

  Editor.withoutNormalizing(editor, () => {
    // wrap selected list items into a new bulleted list
    Transforms.wrapNodes(
      editor,
      {
        type: 'bulleted-list',
      },
      {
        ...lowestMatchedAncestor(editor, 'list-item'),
        at,
      },
    );

    // get the new bulleted list position
    const [, newListPath] = Editor.above(editor, lowestMatchedAncestor(editor, 'list'));

    // get the new parent node (previous list item)
    const parentNode = Editor.previous(editor, {
      at: newListPath,
    });

    moveListToListItem(editor, newListPath, parentNode);
  });

  Editor.normalize(editor);
}

export default keyDownTab;
