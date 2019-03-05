import { withFileControl } from 'netlify-cms-widget-file';

const Control = withFileControl({ forImage: true });
import Preview from './ImagePreview';
export const NetlifyCmsWidgetImage = { Control, Preview };
export { Control, Preview };
