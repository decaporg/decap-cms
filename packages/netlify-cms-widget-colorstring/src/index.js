import controlComponent from './ColorControl';
import previewComponent from './ColorPreview';

const Widget = (opts = {}) => ({
  name: 'color',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetColorString = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetColorString;
