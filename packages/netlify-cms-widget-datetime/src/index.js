import controlComponent from './DateTimeControl';
import previewComponent from './DateTimePreview';

const Widget = (opts = {}) => ({
  name: 'datetime',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetDatetime = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetDatetime;
