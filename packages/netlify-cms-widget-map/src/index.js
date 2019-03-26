import withMapControl from './withMapControl';
import previewComponent from './MapPreview';

const controlComponent = withMapControl();
const Widget = (opts = {}) => ({
  name: 'map',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetMap = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetMap;
