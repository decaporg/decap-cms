import { withFileControl } from 'netlify-cms-widget-file';

const controlComponent = withFileControl({ forImage: true });
import previewComponent from './ImagePreview';
export const NetlifyCmsWidgetImage = { controlComponent, previewComponent };
export { controlComponent, previewComponent };
