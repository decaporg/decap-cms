import getListContainedInListItem from '../selectors/getListContainedInListItem';

function isCursorInItemContainingNestedList(editor) {
  const nestedList = getListContainedInListItem(editor);

  return !!nestedList && `${nestedList[0].type}`.endsWith('-list');
}

export default isCursorInItemContainingNestedList;
