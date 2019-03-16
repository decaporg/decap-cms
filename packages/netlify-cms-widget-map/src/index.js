import withMapControl from './withMapControl';
import previewComponent from './MapPreview';
const controlComponent = withMapControl();

export const NetlifyCmsWidgetMap = { controlComponent, previewComponent };
export { controlComponent, previewComponent };
