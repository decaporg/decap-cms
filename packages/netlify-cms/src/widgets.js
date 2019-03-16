import { registerWidget } from 'netlify-cms-core/src';
import * as NetlifyCmsWidgetString from 'netlify-cms-widget-string/src';
import * as NetlifyCmsWidgetNumber from 'netlify-cms-widget-number/src';
import * as NetlifyCmsWidgetText from 'netlify-cms-widget-text/src';
import * as NetlifyCmsWidgetImage from 'netlify-cms-widget-image/src';
import * as NetlifyCmsWidgetFile from 'netlify-cms-widget-file/src';
import * as NetlifyCmsWidgetSelect from 'netlify-cms-widget-select/src';
import * as NetlifyCmsWidgetMarkdown from 'netlify-cms-widget-markdown/src';
import * as NetlifyCmsWidgetList from 'netlify-cms-widget-list/src';
import * as NetlifyCmsWidgetObject from 'netlify-cms-widget-object/src';
import * as NetlifyCmsWidgetRelation from 'netlify-cms-widget-relation/src';
import * as NetlifyCmsWidgetBoolean from 'netlify-cms-widget-boolean/src';
import * as NetlifyCmsWidgetMap from 'netlify-cms-widget-map/src';
import DateWidget from 'netlify-cms-widget-date/src';
import DateTimeWidget from 'netlify-cms-widget-datetime/src';

registerWidget(
  'string',
  NetlifyCmsWidgetString.controlComponent,
  NetlifyCmsWidgetString.previewComponent,
);
registerWidget(
  'number',
  NetlifyCmsWidgetNumber.controlComponent,
  NetlifyCmsWidgetNumber.previewComponent,
);
registerWidget(
  'text',
  NetlifyCmsWidgetText.controlComponent,
  NetlifyCmsWidgetText.previewComponent,
);
registerWidget(
  'list',
  NetlifyCmsWidgetList.controlComponent,
  NetlifyCmsWidgetList.previewComponent,
);
registerWidget(
  'markdown',
  NetlifyCmsWidgetMarkdown.controlComponent,
  NetlifyCmsWidgetMarkdown.previewComponent,
);
registerWidget(
  'image',
  NetlifyCmsWidgetImage.controlComponent,
  NetlifyCmsWidgetImage.previewComponent,
);
registerWidget(
  'file',
  NetlifyCmsWidgetFile.controlComponent,
  NetlifyCmsWidgetFile.previewComponent,
);
registerWidget(
  'select',
  NetlifyCmsWidgetSelect.controlComponent,
  NetlifyCmsWidgetSelect.previewComponent,
);
registerWidget(
  'object',
  NetlifyCmsWidgetObject.controlComponent,
  NetlifyCmsWidgetObject.previewComponent,
);
registerWidget(
  'relation',
  NetlifyCmsWidgetRelation.controlComponent,
  NetlifyCmsWidgetRelation.previewComponent,
);
registerWidget('boolean', NetlifyCmsWidgetBoolean.controlComponent);
registerWidget('map', NetlifyCmsWidgetMap.controlComponent, NetlifyCmsWidgetMap.previewComponent);
registerWidget([DateWidget(), DateTimeWidget()]);
