import controlComponent from './ListControl';
import NetlifyCmsWidgetObject from 'netlify-cms-widget-object';

const previewComponent = NetlifyCmsWidgetObject.previewComponent;
const Widget = (opts = {}) => ({
  name: 'list',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetList = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetList;
