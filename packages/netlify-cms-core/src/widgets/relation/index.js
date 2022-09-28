import controlComponent from './RelationControl';
import previewComponent from './RelationPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'relation',
    controlComponent,
    previewComponent,
    validator: ({ field, value, t }) => {
      const min = field.get('min');
      const max = field.get('max');

      if (!this.isMultiple()) {
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

export const NetlifyCmsWidgetRelation = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetRelation;
