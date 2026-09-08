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

export const DecapCmsWidgetUuid = { Widget, controlComponent, previewComponent };
export default DecapCmsWidgetUuid;
