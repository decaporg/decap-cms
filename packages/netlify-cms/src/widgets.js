import cms from 'netlify-cms-core/src';

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('string'))
import { StringControl, StringPreview } from 'netlify-cms-widget-string/src';
cms.registerWidget('string', StringControl, StringPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('number'))
import { NumberControl, NumberPreview } from 'netlify-cms-widget-number/src';
cms.registerWidget('number', NumberControl, NumberPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('text'))
import { TextControl, TextPreview } from 'netlify-cms-widget-text/src';
cms.registerWidget('text', TextControl, TextPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('image'))
import { ImageControl, ImagePreview } from 'netlify-cms-widget-image/src';
cms.registerWidget('image', ImageControl, ImagePreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('file'))
import { FileControl, FilePreview } from 'netlify-cms-widget-file/src';
cms.registerWidget('file', FileControl, FilePreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('date'))
import { DateControl, DatePreview } from 'netlify-cms-widget-date/src';
cms.registerWidget('date', DateControl, DatePreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('datetime'))
import { DateTimeControl, DateTimePreview } from 'netlify-cms-widget-datetime/src';
cms.registerWidget('datetime', DateTimeControl, DateTimePreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('select'))
import { SelectControl, SelectPreview } from 'netlify-cms-widget-select/src';
cms.registerWidget('select', SelectControl, SelectPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('markdown'))
import { MarkdownControl, MarkdownPreview } from 'netlify-cms-widget-markdown/src';
cms.registerWidget('markdown', MarkdownControl, MarkdownPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('list'))
import { ListControl, ListPreview } from 'netlify-cms-widget-list/src';
cms.registerWidget('list', ListControl, ListPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('object'))
import { ObjectControl, ObjectPreview } from 'netlify-cms-widget-object/src';
cms.registerWidget('object', ObjectControl, ObjectPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('relation'))
import { RelationControl, RelationPreview } from 'netlify-cms-widget-relation/src';
cms.registerWidget('relation', RelationControl, RelationPreview);
// #endif

// #if e = process.env.ENABLED_WIDGETS, (!e || e.split(',').includes('boolean'))
import { BooleanControl } from 'netlify-cms-widget-boolean/src';
cms.registerWidget('boolean', BooleanControl);
// #endif
