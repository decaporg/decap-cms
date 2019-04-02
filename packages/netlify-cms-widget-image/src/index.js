import NetlifyCmsWidgetFile from 'netlify-cms-widget-file';
import previewComponent from './ImagePreview';

const controlComponent = NetlifyCmsWidgetFile.withFileControl({ forImage: true });
const Widget = (opts = {}) => ({
  name: 'image',
  controlComponent,
  ...opts,
});

export const NetlifyCmsWidgetImage = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetImage;
