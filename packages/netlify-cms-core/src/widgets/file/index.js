import withFileControl from './withFileControl';
import previewComponent from './FilePreview';
import schema from './schema';

const controlComponent = withFileControl();

function Widget(opts = {}) {
  return {
    name: 'file',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetFile = { Widget, controlComponent, previewComponent, withFileControl };
export default NetlifyCmsWidgetFile;
