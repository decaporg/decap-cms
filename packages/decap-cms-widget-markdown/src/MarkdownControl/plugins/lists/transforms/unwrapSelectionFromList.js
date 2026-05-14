import { Editor, Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function unwrapSelectionFromList(editor) {
  Editor.withoutNormalizing(editor, () => {
    Transforms.unwrapNodes(editor, { ...lowestMatchedAncestor(editor, 'list'), split: true });
    Transforms.unwrapNodes(editor, lowestMatchedAncestor(editor, 'list-item'));
  });

  Editor.normalize(editor);
}

export default unwrapSelectionFromList;
