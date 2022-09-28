import controlComponent, { validateMinMax } from './NumberControl';
import previewComponent from './NumberPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'number',
    controlComponent,
    previewComponent,
    validator: ({ field, value, t }) => {
      const hasPattern = !!field.get('pattern', false);
      const min = field.get('min', false);
      const max = field.get('max', false);
  
      // Pattern overrides min/max logic always:
      if (hasPattern) {
        return true;
      }
  
      const error = validateMinMax(value, min, max, field, t);
      return error ? { error } : true;
    },
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetNumber = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetNumber;
