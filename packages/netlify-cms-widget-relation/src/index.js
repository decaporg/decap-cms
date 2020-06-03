import controlComponent from './RelationControl';
import previewComponent from './RelationPreview';
import schema from './schema';

const Widget = (opts = {}) => ({
  name: 'relation',
  controlComponent,
  previewComponent,
  schema,
  ...opts,
});

export const NetlifyCmsWidgetRelation = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetRelation;
