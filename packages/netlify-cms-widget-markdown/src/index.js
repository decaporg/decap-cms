import controlComponent from './MarkdownControl';
import previewComponent from './MarkdownPreview';

const Widget = (opts = {}) => ({
  name: 'markdown',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetMarkdown = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetMarkdown;
