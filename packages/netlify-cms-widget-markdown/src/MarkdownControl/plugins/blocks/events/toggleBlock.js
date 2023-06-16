import { Range, Transforms } from 'slate';

import isCursorInBlockType from '../locations/isCursorInBlockType';
import getListTypeAtCursor from '../locations/getListTypeAtCursor';
import wrapListItemsInBlock from '../transforms/wrapListItemsInBlock';

function toggleBlock(editor, type) {
  const { selection } = editor;
  if (!selection) return;

  const isHeading = type.startsWith('heading-');
  const isActive = isCursorInBlockType(editor, type, isHeading, Range.isExpanded(selection));
  const listType = getListTypeAtCursor(editor);

  // headings do not contain paragraphs so they could be converted, not wrapped/unwrapped
  if (isHeading) {
    Transforms.setNodes(editor, { type: isActive ? 'paragraph' : type });
    return;
  }

  const { focus, anchor } = selection;
  if (
    !isActive &&
    listType &&
    focus.path[focus.path.length - 3] != anchor.path[anchor.path.length - 3]
  ) {
    return wrapListItemsInBlock(editor, type, listType);
  }

  if (!isActive) {
    return Transforms.wrapNodes(editor, { type });
  }

  Transforms.unwrapNodes(editor, { match: n => n.type === type });

  return;
}

export default toggleBlock;
