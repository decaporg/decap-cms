//import { Text, Inline } from 'slate';
import isHotkey from 'is-hotkey';
import CommandsAndQueries from './CommandsAndQueries';
import ListPlugin from './List';
import LineBreak from './LineBreak';
import BreakToDefaultBlock from './BreakToDefaultBlock';
import CloseBlock from './CloseBlock';
import QuoteBlock from './QuoteBlock';
import SelectAll from './SelectAll';
import CopyPasteVisual from './CopyPasteVisual';
import Link from './Link';
import ForceInsert from './ForceInsert';
import Shortcode from './Shortcode';
import { SLATE_DEFAULT_BLOCK_TYPE as defaultType } from '../../types';

const plugins = ({ getAsset, resolveWidget }) => [
  {
    onKeyDown(event, editor, next) {
      if (isHotkey('mod+j', event)) {
        console.log(JSON.stringify(editor.value.document.toJS(), null, 2));
      }
      next();
    },
  },
  CommandsAndQueries({ defaultType }),
  QuoteBlock({ defaultType, type: 'quote' }),
  ListPlugin({ defaultType, unorderedListType: 'bulleted-list', orderedListType: 'numbered-list' }),
  Link({ type: 'link' }),
  LineBreak(),
  BreakToDefaultBlock({ defaultType }),
  CloseBlock({ defaultType }),
  SelectAll(),
  ForceInsert({ defaultType }),
  CopyPasteVisual({ getAsset, resolveWidget }),
  Shortcode({ defaultType }),
];

export default plugins;
