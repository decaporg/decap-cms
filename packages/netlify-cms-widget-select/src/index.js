import controlComponent from './SelectControl';
import previewComponent from './SelectPreview';

const Widget = (opts = {}) => ({
  name: 'select',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetSelect = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetSelect;
