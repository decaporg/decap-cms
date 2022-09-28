import controlComponent from './SelectControl';
import previewComponent from './SelectPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'select',
    controlComponent,
    previewComponent,
    validator: ({ field, value, t }) => {
      const min = field.get('min');
      const max = field.get('max');
  
      if (!field.get('multiple')) {
        return { error: false };
      }
  
      const error = validations.validateMinMax(
        t,
        field.get('label', field.get('name')),
        value,
        min,
        max,
      );
  
      return error ? { error } : { error: false };
    },
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetSelect = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetSelect;
