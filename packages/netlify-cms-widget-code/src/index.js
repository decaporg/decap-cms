import controlComponent from './CodeControl';
import previewComponent from './CodePreview';
import schema from './schema';

const Widget = (opts = {}) => ({
  name: 'code',
  controlComponent,
  previewComponent,
  schema,
  allowMapValue: true,
  codeMirrorConfig: {},
  ...opts,
});

export const NetlifyCmsWidgetCode = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetCode;
