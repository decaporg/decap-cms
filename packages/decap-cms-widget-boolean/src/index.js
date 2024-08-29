import controlComponent from './BooleanControl';

function Widget(opts = {}) {
  return {
    name: 'boolean',
    controlComponent,
    ...opts,
  };
}

export const DecapCmsWidgetBoolean = { Widget, controlComponent };
export default DecapCmsWidgetBoolean;
