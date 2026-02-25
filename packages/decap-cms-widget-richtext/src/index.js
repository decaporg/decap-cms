import controlComponent from './RichtextControl';
import previewComponent from './RichtextPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'richtext',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const DecapCmsWidgetRichtext = { Widget, controlComponent, previewComponent };
export default DecapCmsWidgetRichtext;
