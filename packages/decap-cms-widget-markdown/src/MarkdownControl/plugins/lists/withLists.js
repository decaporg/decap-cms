import { Editor, Element, Node, Transforms } from 'slate';

import keyDown from './events/keyDown';
import moveListToListItem from './transforms/moveListToListItem';
import toggleListType from './events/toggleListType';

function withLists(editor) {
  const { normalizeNode } = editor;
  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => keyDown(event, editor));

  editor.toggleList = type => toggleListType(editor, type);

  editor.isListItem = () => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) &&
          Element.isElement(n) &&
          Editor.isBlock(editor, n) &&
          n.type !== 'paragraph' &&
          !`${n.type}`.startsWith('heading-'),
        mode: 'lowest',
      }),
    );

    return !!match && match[0].type === 'list-item';
  };

  editor.normalizeNode = entry => {
    normalizeNode(entry);
    const [node, path] = entry;

    let previousType = null;
    if (Element.isElement(node) || Editor.isEditor(node)) {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (`${child.type}`.endsWith('-list') && child.type === previousType) {
          Transforms.mergeNodes(editor, { at: childPath });
          break;
        }
        previousType = child.type;
      }
    }

    if (Element.isElement(node) && `${node.type}`.endsWith('-list')) {
      const previousNode = Editor.previous(editor, { at: path });
      const [parentNode, parentNodePath] = Editor.parent(editor, path);

      if (!previousNode && parentNode.type === 'list-item') {
        const previousListItem = Editor.previous(editor, { at: parentNodePath });
        moveListToListItem(editor, path, previousListItem);
        Transforms.removeNodes(editor, { at: parentNodePath });
      }
    }
  };

  return editor;
}

export default withLists;
