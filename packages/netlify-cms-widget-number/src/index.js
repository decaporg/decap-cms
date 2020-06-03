import controlComponent from './NumberControl';
import previewComponent from './NumberPreview';
import schema from './schema';

const Widget = (opts = {}) => ({
  name: 'number',
  controlComponent,
  previewComponent,
  schema,
  ...opts,
});

export const NetlifyCmsWidgetNumber = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetNumber;
