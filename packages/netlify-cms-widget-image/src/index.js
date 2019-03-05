import { withFileControl } from 'netlify-cms-widget-file';

const Control = withFileControl({ forImage: true });
import Preview from './ImagePreview';
export default { Control, Preview };
