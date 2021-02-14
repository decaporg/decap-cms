import controlComponent from './BooleanControl';

function Widget(opts = {}) {
  return {
    name: 'boolean',
    controlComponent,
    ...opts,
  };
}

export const NetlifyCmsWidgetBoolean = { Widget, controlComponent };
export default NetlifyCmsWidgetBoolean;
