import { globalStyles } from 'netlify-cms-widget-date';
import controlComponent from './DateTimeControl';
import { previewComponent } from 'netlify-cms-widget-date';

const Widget = (opts = {}) => ({
  name: 'datetime',
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
