import controlComponent from './StringControl';
import previewComponent from './StringPreview';

function Widget(opts = {}) {
  return {
    name: 'string',
    controlComponent,
    previewComponent,
    ...opts,
  };
}

export const DecapCmsWidgetString = { Widget, controlComponent, previewComponent };
export default DecapCmsWidgetString;
