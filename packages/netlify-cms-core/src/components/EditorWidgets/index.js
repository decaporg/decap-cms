import { registerWidget } from 'Lib/registry';
import UnknownControl from './Unknown/UnknownControl';
import UnknownPreview from './Unknown/UnknownPreview';
import RelationControl from './Relation/RelationControl';
import RelationPreview from './Relation/RelationPreview';

registerWidget('relation', RelationControl, RelationPreview);
registerWidget('unknown', UnknownControl, UnknownPreview);
