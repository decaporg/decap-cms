import controlComponent from './RelationControl';
import previewComponent from './RelationPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'relation',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const DecapCmsWidgetRelation = { Widget, controlComponent, previewComponent };
export default DecapCmsWidgetRelation;
