import registry from '../lib/registry';
import UnknownControl from './Widgets/Unknown/UnknownControl';
import UnknownPreview from './Widgets/Unknown/UnknownPreview';
import StringControl from './Widgets/String/StringControl';
import StringPreview from './Widgets/String/StringPreview';
import NumberControl from './Widgets/Number/NumberControl';
import NumberPreview from './Widgets/Number/NumberPreview';
import ListControl from './Widgets/List/ListControl';
import ListPreview from './Widgets/List/ListPreview';
import TextControl from './Widgets/Text/TextControl';
import TextPreview from './Widgets/Text/TextPreview';
import MarkdownControl from './Widgets/Markdown/MarkdownControl';
import MarkdownPreview from './Widgets/Markdown/MarkdownPreview';
import ImageControl from './Widgets/Image/ImageControl';
import ImagePreview from './Widgets/Image/ImagePreview';
import FileControl from './Widgets/File/FileControl';
import FilePreview from './Widgets/File/FilePreview';
import DateControl from './Widgets/Date/DateControl';
import DatePreview from './Widgets/Date/DatePreview';
import DateTimeControl from './Widgets/DateTime/DateTimeControl';
import DateTimePreview from './Widgets/DateTime/DateTimePreview';
import SelectControl from './Widgets/Select/SelectControl';
import SelectPreview from './Widgets/Select/SelectPreview';
import ObjectControl from './Widgets/Object/ObjectControl';
import ObjectPreview from './Widgets/Object/ObjectPreview';
import RelationControl from './Widgets/Relation/RelationControl';
import RelationPreview from './Widgets/Relation/RelationPreview';
import BooleanControl from './Widgets/Boolean/BooleanControl';


registry.registerWidget('string', StringControl, StringPreview);
registry.registerWidget('text', TextControl, TextPreview);
registry.registerWidget('number', NumberControl, NumberPreview);
registry.registerWidget('list', ListControl, ListPreview);
registry.registerWidget('markdown', MarkdownControl, MarkdownPreview);
registry.registerWidget('image', ImageControl, ImagePreview);
registry.registerWidget('file', FileControl, FilePreview);
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
