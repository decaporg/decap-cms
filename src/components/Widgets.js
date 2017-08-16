import registry from '../lib/registry';
import UnknownControl from './Widgets/UnknownControl';
import UnknownPreview from './Widgets/UnknownPreview';
import StringControl from './Widgets/StringControl';
import StringPreview from './Widgets/StringPreview';
import NumberControl from './Widgets/NumberControl';
import NumberPreview from './Widgets/NumberPreview';
import ListControl from './Widgets/ListControl';
import ListPreview from './Widgets/ListPreview';
import TextControl from './Widgets/TextControl';
import TextPreview from './Widgets/TextPreview';
import MarkdownControl from './Widgets/Markdown/MarkdownControl';
import MarkdownPreview from './Widgets/Markdown/MarkdownPreview';
import ImageControl from './Widgets/ImageControl';
import ImagePreview from './Widgets/ImagePreview';
import FileControl from './Widgets/FileControl';
import FilePreview from './Widgets/FilePreview';
import MediaControl from './Widgets/MediaControl';
import MediaPreview from './Widgets/MediaPreview';
import DateControl from './Widgets/DateControl';
import DatePreview from './Widgets/DatePreview';
import DateTimeControl from './Widgets/DateTimeControl';
import DateTimePreview from './Widgets/DateTimePreview';
import SelectControl from './Widgets/SelectControl';
import SelectPreview from './Widgets/SelectPreview';
import ObjectControl from './Widgets/ObjectControl';
import ObjectPreview from './Widgets/ObjectPreview';
import RelationControl from './Widgets/RelationControl';
import RelationPreview from './Widgets/RelationPreview';
import BooleanControl from './Widgets/BooleanControl';


registry.registerWidget('string', StringControl, StringPreview);
registry.registerWidget('text', TextControl, TextPreview);
registry.registerWidget('number', NumberControl, NumberPreview);
registry.registerWidget('list', ListControl, ListPreview);
registry.registerWidget('markdown', MarkdownControl, MarkdownPreview);
registry.registerWidget('image', ImageControl, ImagePreview);
registry.registerWidget('file', FileControl, FilePreview);
registry.registerWidget('media', MediaControl, MediaPreview);
registry.registerWidget('date', DateControl, DatePreview);
registry.registerWidget('datetime', DateTimeControl, DateTimePreview);
registry.registerWidget('select', SelectControl, SelectPreview);
registry.registerWidget('object', ObjectControl, ObjectPreview);
registry.registerWidget('relation', RelationControl, RelationPreview);
registry.registerWidget('boolean', BooleanControl);
registry.registerWidget('unknown', UnknownControl, UnknownPreview);

export function resolveWidget(name) { // eslint-disable-line
  return registry.getWidget(name || 'string') || registry.getWidget('unknown');
}
