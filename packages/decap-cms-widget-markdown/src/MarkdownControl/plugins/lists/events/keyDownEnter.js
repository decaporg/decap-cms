import { Range, Transforms } from 'slate';

import splitListItem from '../transforms/splitListItem';
import isCursorAtListItemStart from '../locations/isCursorAtListItemStart';
import liftListItem from '../transforms/liftListItem';
import convertParagraphToListItem from '../transforms/convertParagraphToListItem';
import isCursorAtNoninitialParagraphStart from '../locations/isCursorAtNoninitialParagraphStart';
import splitToNestedList from '../transforms/splitToNestedList';
import getListContainedInListItem from '../selectors/getListContainedInListItem';

function keyDownEnter(editor) {
  if (!editor.selection) return;

  // Pressing enter will delete current selection in any case
  if (Range.isExpanded(editor.selection)) {
    Transforms.delete(editor);
  }

  // if edge of selection is in the beginning of the first text node in list-item
  if (isCursorAtListItemStart(editor)) {
    return liftListItem(editor);
  }

  // if list has a nested list, insert new item to the beginning of the nested list
  const nestedList = getListContainedInListItem(editor);
  if (!!nestedList && `${nestedList[0].type}`.endsWith('-list')) {
    return splitToNestedList(editor, nestedList[0].type);
  }

  // if a paragraph in a list and has previous siblings, convert it to a list item
  if (isCursorAtNoninitialParagraphStart(editor)) {
    return convertParagraphToListItem(editor);
  }

  // otherwise create a new list item
  splitListItem(editor);
}

export default keyDownEnter;
