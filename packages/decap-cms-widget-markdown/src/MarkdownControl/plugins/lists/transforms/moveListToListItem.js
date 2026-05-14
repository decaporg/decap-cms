import { Transforms } from 'slate';

function moveListToListItem(editor, listPath, targetListItem) {
  const [targetItem, targetPath] = targetListItem;

  // move the node to the last child position of the parent node
  Transforms.moveNodes(editor, {
    at: listPath,
    to: [...targetPath, targetItem.children.length],
  });
}

export default moveListToListItem;
