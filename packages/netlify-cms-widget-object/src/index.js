import controlComponent from './ObjectControl';
import previewComponent from './ObjectPreview';

const Widget = (opts = {}) => ({
  name: 'object',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetObject = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetObject;
