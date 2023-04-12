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
    // todo: split list if multiple list items selected, old implementation below
    Transforms.wrapNodes(editor, { type });
    return;
  }

  Transforms.unwrapNodes(editor, { match: n => n.type === type });

  return;
}

export default toggleBlock;

/*
      if (
        isListItem &&
        selection.focus.path[selection.focus.path.length - 3] !=
          selection.anchor.path[selection.anchor.path.length - 3]
      ) {
        const listType = isBlockActive(editor, 'bulleted-list') ? 'bulleted-list' : 'numbered-list';
        Transforms.wrapNodes(
          editor,
          { type: listType },
          {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
          },
        );
        Transforms.wrapNodes(
          editor,
          { type: format },
          {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) - 3,
          },
        );
        Transforms.liftNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 4,
          split: true,
        });
        // Transforms.liftNodes(editor, {
        //   match: (_, path) => path.length === getSelectionMinPathLength(editor) - 3,
        //   split: true,
        // });

        // Transforms.wrapNodes(
        //   editor,
        //   { type: format },
        //   {
        //     match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
        //   },
        // );
      } else {
        Transforms.wrapNodes(editor, { type: format });
      }
*/
