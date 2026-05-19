import { Editor, Transforms } from 'slate';

function wrapListItemsInBlock(editor, blockType, listType) {
  Editor.withoutNormalizing(editor, () => {
    Transforms.wrapNodes(editor, { type: listType });
    Transforms.wrapNodes(editor, { type: blockType }, { match: n => n.type === listType });
    Transforms.liftNodes(editor, { match: n => n.type === blockType });
  });
  Editor.normalize(editor, { force: true });
}
export default wrapListItemsInBlock;
