import { Range } from "slate";

function isCursorAtListItemStart(editor) {
  if (!editor.selection) return false;

  const { offset, path } = Range.start(editor.selection);
  console.log('is at start?')
  return (
    offset === 0 && path.length >= 2 && path[path.length - 1] === 0 && path[path.length - 2] === 0
  );
}

export default isCursorAtListItemStart;
