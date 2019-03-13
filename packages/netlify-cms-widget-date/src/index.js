import controlComponent from './DateControl';
import previewComponent from './DatePreview';

const Widget = (opts = {}) => ({
  name: 'date',
  controlComponent,
  previewComponent,
  ...opts,
});

export { Widget as default, controlComponent, previewComponent };
