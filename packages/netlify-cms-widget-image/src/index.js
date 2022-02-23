import NetlifyCmsWidgetFile from 'netlify-cms-widget-file';

import previewComponent from './ImagePreview';
import schema from './schema';

const controlComponent = NetlifyCmsWidgetFile.withFileControl({ forImage: true });

function Widget(opts = {}) {
  return {
    name: 'image',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetImage = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetImage;
