import { NetlifyCmsCore as CMS } from 'netlify-cms-core';
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
import { NetlifyCmsWidgetDate } from 'netlify-cms-widget-date';
import { NetlifyCmsWidgetDatetime } from 'netlify-cms-widget-datetime';

CMS.registerWidget(
  'string',
  NetlifyCmsWidgetString.controlComponent,
  NetlifyCmsWidgetString.previewComponent,
);
CMS.registerWidget(
  'number',
  NetlifyCmsWidgetNumber.controlComponent,
  NetlifyCmsWidgetNumber.previewComponent,
);
CMS.registerWidget(
  'text',
  NetlifyCmsWidgetText.controlComponent,
  NetlifyCmsWidgetText.previewComponent,
);
CMS.registerWidget(
  'list',
  NetlifyCmsWidgetList.controlComponent,
  NetlifyCmsWidgetList.previewComponent,
);
CMS.registerWidget(
  'markdown',
  NetlifyCmsWidgetMarkdown.controlComponent,
  NetlifyCmsWidgetMarkdown.previewComponent,
);
CMS.registerWidget(
  'image',
  NetlifyCmsWidgetImage.controlComponent,
  NetlifyCmsWidgetImage.previewComponent,
);
CMS.registerWidget(
  'file',
  NetlifyCmsWidgetFile.controlComponent,
  NetlifyCmsWidgetFile.previewComponent,
);
CMS.registerWidget(
  'select',
  NetlifyCmsWidgetSelect.controlComponent,
  NetlifyCmsWidgetSelect.previewComponent,
);
CMS.registerWidget(
  'object',
  NetlifyCmsWidgetObject.controlComponent,
  NetlifyCmsWidgetObject.previewComponent,
);
CMS.registerWidget(
  'relation',
  NetlifyCmsWidgetRelation.controlComponent,
  NetlifyCmsWidgetRelation.previewComponent,
);
CMS.registerWidget('boolean', NetlifyCmsWidgetBoolean.controlComponent);
CMS.registerWidget('map', NetlifyCmsWidgetMap.controlComponent, NetlifyCmsWidgetMap.previewComponent);
CMS.registerWidget([NetlifyCmsWidgetDate.Widget(), NetlifyCmsWidgetDatetime.Widget()]);
