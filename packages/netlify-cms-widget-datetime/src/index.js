import controlComponent from './DateTimeControl';
import { previewComponent } from 'netlify-cms-widget-date';

const Widget = (opts = {}) => ({
  name: 'datetime',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetDatetime = { Widget, controlComponent, previewComponent };
export { Widget as default, controlComponent, previewComponent };
