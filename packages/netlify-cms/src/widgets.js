import { NetlifyCmsCore as CMS } from 'netlify-cms-core';
import NetlifyCmsWidgetString from 'netlify-cms-widget-string';
import NetlifyCmsWidgetNumber from 'netlify-cms-widget-number';
import NetlifyCmsWidgetText from 'netlify-cms-widget-text';
import NetlifyCmsWidgetImage from 'netlify-cms-widget-image';
import NetlifyCmsWidgetFile from 'netlify-cms-widget-file';
import NetlifyCmsWidgetSelect from 'netlify-cms-widget-select';
import NetlifyCmsWidgetMarkdown from 'netlify-cms-widget-markdown';
import NetlifyCmsWidgetList from 'netlify-cms-widget-list';
import NetlifyCmsWidgetObject from 'netlify-cms-widget-object';
import NetlifyCmsWidgetRelation from 'netlify-cms-widget-relation';
import NetlifyCmsWidgetBoolean from 'netlify-cms-widget-boolean';
import NetlifyCmsWidgetMap from 'netlify-cms-widget-map';
import NetlifyCmsWidgetDate from 'netlify-cms-widget-date';
import NetlifyCmsWidgetDatetime from 'netlify-cms-widget-datetime';

CMS.registerWidget([
  NetlifyCmsWidgetString.Widget(),
  NetlifyCmsWidgetNumber.Widget(),
  NetlifyCmsWidgetText.Widget(),
  NetlifyCmsWidgetImage.Widget(),
  NetlifyCmsWidgetFile.Widget(),
  NetlifyCmsWidgetSelect.Widget(),
  NetlifyCmsWidgetMarkdown.Widget(),
  NetlifyCmsWidgetList.Widget(),
  NetlifyCmsWidgetObject.Widget(),
  NetlifyCmsWidgetRelation.Widget(),
  NetlifyCmsWidgetBoolean.Widget(),
  NetlifyCmsWidgetMap.Widget(),
  NetlifyCmsWidgetDate.Widget(),
  NetlifyCmsWidgetDatetime.Widget(),
]);
