import { Transforms } from "slate";

import isCursorInBlockType from "../locations/isCursorInBlockType";

function toggleBlock(editor, type) {
  const isHeading = type.startsWith('heading-');
  const isActive = isCursorInBlockType(editor, type, isHeading);

  // headings do not contain paragraphs so they could be converted, not wrapped/unwrapped
  if (isHeading) {
    Transforms.setNodes(editor, { type: isActive ? 'paragraph' : type });
    return;
  }

  if (!isActive) {
    Transforms.wrapNodes(editor, { type });
    return;
  }

  Transforms.unwrapNodes(editor, { match: n => n.type === type });

  return;
}


export default toggleBlock;
