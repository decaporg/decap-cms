import { registerWidget } from 'Lib/registry';
import UnknownControl from './Unknown/UnknownControl';
import UnknownPreview from './Unknown/UnknownPreview';
import NumberControl from './Number/NumberControl';
import NumberPreview from './Number/NumberPreview';
import TextControl from './Text/TextControl';
import TextPreview from './Text/TextPreview';
import SelectControl from './Select/SelectControl';
import SelectPreview from './Select/SelectPreview';
import RelationControl from './Relation/RelationControl';
import RelationPreview from './Relation/RelationPreview';

registerWidget('text', TextControl, TextPreview);
registerWidget('number', NumberControl, NumberPreview);
registerWidget('select', SelectControl, SelectPreview);
registerWidget('relation', RelationControl, RelationPreview);
registerWidget('unknown', UnknownControl, UnknownPreview);
