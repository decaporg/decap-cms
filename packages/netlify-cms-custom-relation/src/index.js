import CustomRelationPreview from './CustomRelationPreview';
import createControl from './createControl';

const createCustomRelationWidget = params => ({
  control: createControl(params),
  preview: CustomRelationPreview,
});

export default createCustomRelationWidget;
