import { Editor, Node, Transforms } from "slate";
import isSelectionWithinNoninitialListItem from "./locations/isSelectionWithinNoninitialListItem";

function keyDownTab(editor) {
  if (!editor.selection) return;

  if (!isSelectionWithinNoninitialListItem(editor)) return;

  Editor.withoutNormalizing(editor, () => {
    // Transforms.wrapNodes()
    Transforms.wrapNodes(editor, {
      type: 'bulleted-list'
    }, {
      match: n => n.type === 'list-item',
      mode: 'lowest'
    });

    const [, newListPath] = Editor.above(editor, {
      match: n => n.type === 'bulleted-list',
      mode: 'lowest'
    });

    const firstNode = Editor.previous(editor, {
      at: newListPath
    });

    console.log(firstNode[0])

    Transforms.moveNodes(editor, {
      at: newListPath,
      to: [...firstNode[1], firstNode[0].children.length],
    })

    // Transforms.wrapNodes(editor, {
    //   type: 'bulleted-list'
    // }, {
    //   match: n => n.type === 'list-item',
    // });

    console.log('editor value', JSON.parse(JSON.stringify(editor.children)));

  });

  Editor.normalize(editor);

  console.log('editor value', JSON.parse(JSON.stringify(editor.children)));
}

export default keyDownTab;
