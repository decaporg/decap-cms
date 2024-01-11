import DecapCmsWidgetObject from 'decap-cms-widget-object';

import controlComponent, {OptionalObjectControl} from './ListControl';
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

function OptionalObjectWidget(opts = {}) {
  return {
    name: 'object',
    controlComponent: OptionalObjectControl,
    previewComponent,
    ...opts,
  }
}

export const DecapCmsWidgetList = { Widget, controlComponent, previewComponent, OptionalObjectWidget };
export default DecapCmsWidgetList;
