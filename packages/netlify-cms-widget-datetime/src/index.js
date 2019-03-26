import controlComponent from './DateTimeControl';
import NetlifyCmsWidgetDate from 'netlify-cms-widget-date';

const previewComponent = NetlifyCmsWidgetDate.previewComponent;
const Widget = (opts = {}) => ({
  name: 'datetime',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetDatetime = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetDatetime;
