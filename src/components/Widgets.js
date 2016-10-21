import registry from '../lib/registry';
import UnknownControl from './Widgets/UnknownControl';
import UnknownPreview from './Widgets/UnknownPreview';
import StringControl from './Widgets/StringControl';
import StringPreview from './Widgets/StringPreview';
import ListControl from './Widgets/ListControl';
import ListPreview from './Widgets/ListPreview';
import TextControl from './Widgets/TextControl';
import TextPreview from './Widgets/TextPreview';
import MarkdownControl from './Widgets/MarkdownControl';
import MarkdownPreview from './Widgets/MarkdownPreview';
import ImageControl from './Widgets/ImageControl';
import ImagePreview from './Widgets/ImagePreview';
import DateTimeControl from './Widgets/DateTimeControl';
import DateTimePreview from './Widgets/DateTimePreview';

registry.registerWidget('string', StringControl, StringPreview);
registry.registerWidget('text', TextControl, TextPreview);
registry.registerWidget('list', ListControl, ListPreview);
registry.registerWidget('markdown', MarkdownControl, MarkdownPreview);
registry.registerWidget('image', ImageControl, ImagePreview);
registry.registerWidget('datetime', DateTimeControl, DateTimePreview);
registry.registerWidget('_unknown', UnknownControl, UnknownPreview);

export function resolveWidget(name) {
  return registry.getWidget(name) || registry.getWidget('_unknown');
}
