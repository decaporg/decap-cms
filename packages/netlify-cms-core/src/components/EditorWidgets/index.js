import { registerWidget } from 'Lib/registry';
import UnknownControl from './Unknown/UnknownControl';
import UnknownPreview from './Unknown/UnknownPreview';

registerWidget('unknown', UnknownControl, UnknownPreview);
