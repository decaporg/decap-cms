import withFileControl from './withFileControl';
import previewComponent from './FilePreview';

const controlComponent = withFileControl();
const Widget = (opts = {}) => ({
  name: 'file',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetFile = { Widget, controlComponent, previewComponent, withFileControl };
export default NetlifyCmsWidgetFile;
