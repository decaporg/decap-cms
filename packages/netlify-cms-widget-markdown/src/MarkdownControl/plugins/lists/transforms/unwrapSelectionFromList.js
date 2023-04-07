import { Editor, Transforms } from "slate";

import lowestMatchedAncestor from "../matchers/lowestMatchedAncestor";

function unwrapSelectionFromList(editor) {
  Editor.withoutNormalizing(editor, () => {
    Transforms.unwrapNodes(editor, { ...lowestMatchedAncestor('list'), split: true });
    Transforms.unwrapNodes(editor, lowestMatchedAncestor('list-item'));
  });

  Editor.normalize(editor);
}

export default unwrapSelectionFromList;
