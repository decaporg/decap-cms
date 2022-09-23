import controlComponent from './SelectControl';
import previewComponent from './SelectPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'select',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetSelect = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetSelect;
