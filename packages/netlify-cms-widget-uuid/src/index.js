import controlComponent from './UuidControl';
import previewComponent from './UuidPreview';

function Widget(opts = {}) {
  return {
    name: 'uuid',
    controlComponent,
    previewComponent,
    ...opts,
  };
}

export const NetlifyCmsWidgetUuid = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetUuid;
