import { Editor, Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function changeListType(editor, type) {
  Editor.withoutNormalizing(editor, () => {
    // wrap selected list items into new type
    Transforms.wrapNodes(editor, { type }, lowestMatchedAncestor(editor, 'list-item'));
    // lift the new list of the current list, split if necessary
    Transforms.liftNodes(editor, lowestMatchedAncestor(editor, type));
  });

  Editor.normalize(editor, { force: true });
}

export default changeListType;
