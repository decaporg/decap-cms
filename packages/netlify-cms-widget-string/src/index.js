import controlComponent from './StringControl';
import previewComponent from './StringPreview';

const Widget = (opts = {}) => ({
  name: 'string',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetString = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetString;
