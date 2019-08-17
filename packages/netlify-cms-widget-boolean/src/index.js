import controlComponent from './BooleanControl';

const Widget = (opts = {}) => ({
  name: 'boolean',
  controlComponent,
  ...opts,
});

export const NetlifyCmsWidgetBoolean = { Widget, controlComponent };
export default NetlifyCmsWidgetBoolean;
