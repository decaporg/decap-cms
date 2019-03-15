import withFileControl from './withFileControl';
import previewComponent from './FilePreview';

const controlComponent = withFileControl();
export const NetlifyCmsWidgetFile = { controlComponent, previewComponent, withFileControl };
export { controlComponent, previewComponent, withFileControl };
