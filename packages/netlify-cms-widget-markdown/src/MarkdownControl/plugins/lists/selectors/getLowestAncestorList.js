import { Editor } from "slate";

import lowestMatchedAncestor from "../matchers/lowestMatchedAncestor";

function getLowestAncestorList(editor) {
  if (!editor.selection) return false;

  return Editor.above(editor, lowestMatchedAncestor('list'));
}

export default getLowestAncestorList;
