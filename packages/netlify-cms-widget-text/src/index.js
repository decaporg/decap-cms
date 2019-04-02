import controlComponent from './TextControl';
import previewComponent from './TextPreview';

const Widget = (opts = {}) => ({
  name: 'text',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetText = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetText;
