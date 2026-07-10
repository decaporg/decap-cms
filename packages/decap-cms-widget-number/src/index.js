import controlComponent from './NumberControl';
import previewComponent from './NumberPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'number',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const DecapCmsWidgetNumber = { Widget, controlComponent, previewComponent };
export default DecapCmsWidgetNumber;
