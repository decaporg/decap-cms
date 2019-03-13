import globalStyles from 'react-datetime/css/react-datetime.css';
import controlComponent from './DateControl';
import previewComponent from './DatePreview';

const Widget = (opts = {}) => ({
  name: 'date',
  controlComponent,
  previewComponent,
  globalStyles,
  ...opts,
});

export {
  Widget as default,
  controlComponent,
  previewComponent,
  globalStyles,
};
