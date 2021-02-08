import controlComponent from './StringControl';
import previewComponent from './StringPreview';

function Widget(opts = {}) {
  return {
    name: 'string',
    controlComponent,
    previewComponent,
    ...opts,
  };
}

export const NetlifyCmsWidgetString = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetString;
