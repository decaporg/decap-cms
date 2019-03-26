import controlComponent from './DateControl';
import previewComponent from './DatePreview';

const Widget = (opts = {}) => ({
  name: 'date',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetDate = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetDate;
