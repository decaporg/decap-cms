import DecapCmsWidgetObject from 'decap-cms-widget-object';

import controlComponent, { ObjectControlWrapper } from './ListControl';
import schema from './schema';

const previewComponent = DecapCmsWidgetObject.previewComponent;

function Widget(opts = {}) {
  return {
    name: 'list',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

function ObjectWidget(opts = {}) {
  return {
    name: 'object',
    controlComponent: ObjectControlWrapper,
    previewComponent,
    ...opts,
  };
}

export const DecapCmsWidgetList = { Widget, controlComponent, previewComponent, ObjectWidget };
export default DecapCmsWidgetList;
