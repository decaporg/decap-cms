import { registerWidget } from 'netlify-cms-core';
import * as NetlifyCmsWidgetString from 'netlify-cms-widget-string';
import * as NetlifyCmsWidgetNumber from 'netlify-cms-widget-number';
import * as NetlifyCmsWidgetText from 'netlify-cms-widget-text';
import * as NetlifyCmsWidgetImage from 'netlify-cms-widget-image';
import * as NetlifyCmsWidgetFile from 'netlify-cms-widget-file';
import * as NetlifyCmsWidgetSelect from 'netlify-cms-widget-select';
import * as NetlifyCmsWidgetMarkdown from 'netlify-cms-widget-markdown';
import * as NetlifyCmsWidgetList from 'netlify-cms-widget-list';
import * as NetlifyCmsWidgetObject from 'netlify-cms-widget-object';
import * as NetlifyCmsWidgetRelation from 'netlify-cms-widget-relation';
import * as NetlifyCmsWidgetBoolean from 'netlify-cms-widget-boolean';
import * as NetlifyCmsWidgetMap from 'netlify-cms-widget-map';
import DateWidget from 'netlify-cms-widget-date';
import DateTimeWidget from 'netlify-cms-widget-datetime';

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
