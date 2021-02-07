import controlComponent from './ObjectControl';
import previewComponent from './ObjectPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'object',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetObject = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetObject;
