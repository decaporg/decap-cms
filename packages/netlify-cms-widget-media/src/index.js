import withFileControl from './withFileControl';
import previewComponent from './FilePreview';
import schema from './schema';

const controlComponent = withFileControl();
const Widget = (opts = {}) => ({
  name: 'media',
  controlComponent,
  previewComponent,
  schema,
  ...opts,
});

export const NetlifyCmsWidgetMedia = {
  Widget,
  controlComponent,
  previewComponent,
  withFileControl,
};
export default NetlifyCmsWidgetMedia;
