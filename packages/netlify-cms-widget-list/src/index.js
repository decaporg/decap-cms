import controlComponent from './ListControl';
import NetlifyCmsWidgetObject from 'netlify-cms-widget-object';
import schema from './schema';

const previewComponent = NetlifyCmsWidgetObject.previewComponent;

function Widget(opts = {}) {
  return {
    name: 'list',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetList = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetList;
