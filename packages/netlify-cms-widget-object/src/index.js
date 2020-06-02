import controlComponent from './ObjectControl';
import previewComponent from './ObjectPreview';
import schema from './Schema';

const Widget = (opts = {}) => ({
  name: 'object',
  controlComponent,
  previewComponent,
  schema,
  ...opts,
});

export const NetlifyCmsWidgetObject = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetObject;
