import controlComponent from './ColorControl';
import previewComponent from './ColorPreview';

function Widget(opts = {}) {
  return {
    name: 'color',
    controlComponent,
    previewComponent,
    ...opts,
  };
}

export const DecapCmsWidgetColorString = { Widget, controlComponent, previewComponent };
export default DecapCmsWidgetColorString;
