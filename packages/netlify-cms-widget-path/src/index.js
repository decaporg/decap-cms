import controlComponent from './PathControl';
import previewComponent from './PathPreview';

const Widget = (opts = {}) => ({
  name: 'path',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetString = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetString;
