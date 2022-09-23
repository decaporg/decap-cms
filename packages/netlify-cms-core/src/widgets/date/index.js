import controlComponent from './DateControl';
import previewComponent from './DatePreview';

function Widget(opts = {}) {
  return {
    name: 'date',
    controlComponent,
    previewComponent,
    ...opts,
  };
}

export const NetlifyCmsWidgetDate = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetDate;
