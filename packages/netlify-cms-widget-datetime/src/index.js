import controlComponent from './DateTimeControl';
import previewComponent from './DateTimePreview';
import schema from './Schema';

const Widget = (opts = {}) => ({
  name: 'datetime',
  controlComponent,
  previewComponent,
  schema,
  ...opts,
});

export const NetlifyCmsWidgetDatetime = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetDatetime;
