import { Range } from 'slate';

function isCursorAtListItemStart(editor) {
  if (!editor.selection) return false;

  const { offset, path } = Range.start(editor.selection);
  // todo: this will break when there are marks inside list items, use Edior.isStart on first block parent instead (see isCursorAtEndOfParagraph)
  return (
    offset === 0 && path.length >= 2 && path[path.length - 1] === 0 && path[path.length - 2] === 0
  );
}

export default isCursorAtListItemStart;
