import controlComponent from './MarkdownControl';
import previewComponent from './MarkdownPreview';
import schema from './schema';

function Widget(opts = {}) {
  return {
    name: 'markdown',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export const NetlifyCmsWidgetMarkdown = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetMarkdown;
