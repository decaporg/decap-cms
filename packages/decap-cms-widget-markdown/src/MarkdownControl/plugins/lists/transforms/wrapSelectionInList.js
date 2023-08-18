import { Editor, Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function wrapSelectionInList(editor, type) {
  Editor.withoutNormalizing(editor, () => {
    Transforms.wrapNodes(editor, { type });
    const listItems = Editor.nodes(editor, lowestMatchedAncestor(editor, 'paragraph'));
    for (const listItem of listItems) {
      Transforms.wrapNodes(editor, { type: 'list-item' }, { at: listItem[1] });
    }
  });

  Editor.normalize(editor);
}

export default wrapSelectionInList;
