import controlComponent from './NumberControl';
import previewComponent from './NumberPreview';

const Widget = (opts = {}) => ({
  name: 'number',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetNumber = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetNumber;
