import controlComponent from './CodeControl';
import previewComponent from './CodePreview';

const Widget = (opts = {}) => ({
  name: 'code',
  controlComponent,
  previewComponent,
  allowMapValue: true,
  codeMirrorConfig: {},
  ...opts,
});

export const NetlifyCmsWidgetCode = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetCode;
