import { registerWidget } from '../lib/registry';
import UnknownControl from './Unknown/UnknownControl';
import UnknownPreview from './Unknown/UnknownPreview';
import StringControl from './String/StringControl';
import StringPreview from './String/StringPreview';
import NumberControl from './Number/NumberControl';
import NumberPreview from './Number/NumberPreview';
import TextControl from './Text/TextControl';
import TextPreview from './Text/TextPreview';
import MarkdownControl from './Markdown/MarkdownControl';
import MarkdownPreview from './Markdown/MarkdownPreview';
import ImageControl from './Image/ImageControl';
import ImagePreview from './Image/ImagePreview';
import FileControl from './File/FileControl';
import FilePreview from './File/FilePreview';
import DateControl from './Date/DateControl';
import DatePreview from './Date/DatePreview';
import DateTimeControl from './DateTime/DateTimeControl';
import DateTimePreview from './DateTime/DateTimePreview';
import SelectControl from './Select/SelectControl';
import SelectPreview from './Select/SelectPreview';
import BooleanControl from './Boolean/BooleanControl';

/**
 * The following widgets utilize API's that are not available to third party
 * widgets.  Privileged widgets are an anti-pattern, and necessary changes
 * should take place so that these widgets can be recreated by a third party.
 */
import ListControl from './PrivilegedList/PrivilegedListControl';
import ListPreview from './PrivilegedList/PrivilegedListPreview';
import ObjectControl from './PrivilegedObject/PrivilegedObjectControl';
import ObjectPreview from './PrivilegedObject/PrivilegedObjectPreview';
import RelationControl from './PrivilegedRelation/PrivilegedRelationControl';
import RelationPreview from './PrivilegedRelation/PrivilegedRelationPreview';


registerWidget('string', StringControl, StringPreview);
registerWidget('text', TextControl, TextPreview);
registerWidget('number', NumberControl, NumberPreview);
registerWidget('list', ListControl, ListPreview);
registerWidget('markdown', MarkdownControl, MarkdownPreview);
registerWidget('image', ImageControl, ImagePreview);
registerWidget('file', FileControl, FilePreview);
registerWidget('date', DateControl, DatePreview);
registerWidget('datetime', DateTimeControl, DateTimePreview);
registerWidget('select', SelectControl, SelectPreview);
registerWidget('object', ObjectControl, ObjectPreview);
registerWidget('relation', RelationControl, RelationPreview);
registerWidget('boolean', BooleanControl);
registerWidget('unknown', UnknownControl, UnknownPreview);
