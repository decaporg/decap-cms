import dateTimeStyles from 'react-datetime/css/react-datetime.css';
import DateControl from './DateControl';
import DatePreview from './DatePreview';

const DateWidget = {
  name: 'date',
  controlComponent: DateControl,
  previewComponent: DatePreview,
  globalStyles: dateTimeStyles,
};

export { DateControl, DatePreview, DateWidget };
