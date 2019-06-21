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
import { SLATE_DEFAULT_BLOCK_TYPE } from '../../types';

const plugins = ({ getAsset, resolveWidget }) => [
  CommandsAndQueries(),
  QuoteBlock(),
  ListPlugin({
    defaultBlockType: SLATE_DEFAULT_BLOCK_TYPE,
    unorderedListType: 'bulleted-list',
    orderedListType: 'numbered-list',
  }),
  Link(),
  LineBreak(),
  BreakToDefaultBlock(),
  CloseBlock(),
  SelectAll(),
  ForceInsert(),
  CopyPasteVisual({ getAsset, resolveWidget }),
  Shortcode(),
];

export default plugins;
