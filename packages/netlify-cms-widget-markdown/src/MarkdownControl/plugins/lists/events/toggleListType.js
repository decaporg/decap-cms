import isCursorInListItem from '../locations/isCursorInListItem';
import getLowestAncestorList from '../selectors/getLowestAncestorList';
import wrapSelectionInList from '../transforms/wrapSelectionInList';
import changeListType from '../transforms/changeListType';
import unwrapSelectionFromList from '../transforms/unwrapSelectionFromList';

function toggleListType(editor, type) {
  // list being active means that we are in a paragraph or heading whose parent is a list
  // if no list is active, wrap selection in a new list of the given type
  if (!isCursorInListItem(editor)) {
    return wrapSelectionInList(editor, type);
  }
  // if a list is active but the type doesn't match, change selection to the given list type
  const currentList = getLowestAncestorList(editor);
  if (currentList && currentList[0].type !== type) {
    return changeListType(editor, type);
  }

  // if a list is active and the type matches, unwrap selection from the list
  return unwrapSelectionFromList(editor);
}

export default toggleListType;
