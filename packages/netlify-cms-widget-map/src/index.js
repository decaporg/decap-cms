import withMapControl from './withMapControl';
import previewComponent from './MapPreview';
import schema from './schema';

const controlComponent = withMapControl();
const Widget = (opts = {}) => ({
  name: 'map',
  controlComponent,
  previewComponent,
  schema,
  ...opts,
});

export const NetlifyCmsWidgetMap = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetMap;
