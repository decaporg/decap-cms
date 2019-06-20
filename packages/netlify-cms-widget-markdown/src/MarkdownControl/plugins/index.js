//import { Text, Inline } from 'slate';
import isHotkey from 'is-hotkey';
import CommandsAndQueries from './CommandsAndQueries';
import ListPlugin from './List';
import LineBreak from './LineBreak';
import BreakToDefaultBlock from './BreakToDefaultBlock';
import CloseBlock from './CloseBlock';
import QuoteBlock from './QuoteBlock';
import SelectAll from './SelectAll';
import { SLATE_DEFAULT_BLOCK_TYPE } from '../../types';

const Logger = () => ({
  commands: {
    log(editor) {
      console.log(JSON.stringify(editor.value.toJS(), null, 2));
      console.log(JSON.stringify(editor.value.selection.toJS(), null, 2));
    },
  },
  onKeyDown(event, editor, next) {
    if (isHotkey('mod+j', event)) {
      editor.log();
      event.preventDefault();
    } else {
      return next();
    }
  },
});

const plugins = [
  Logger(),
  CommandsAndQueries(),
  QuoteBlock(),
  ListPlugin({
    defaultBlockType: SLATE_DEFAULT_BLOCK_TYPE,
    unorderedListType: 'bulleted-list',
    orderedListType: 'numbered-list',
  }),
  LineBreak(),
  BreakToDefaultBlock(),
  CloseBlock(),
  SelectAll(),
];

export default plugins;
