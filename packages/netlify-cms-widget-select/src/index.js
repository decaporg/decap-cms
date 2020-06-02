import controlComponent from './SelectControl';
import previewComponent from './SelectPreview';
import schema from './Schema';

const Widget = (opts = {}) => ({
  name: 'select',
  controlComponent,
  previewComponent,
  schema,
  ...opts,
});

export const NetlifyCmsWidgetSelect = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetSelect;
