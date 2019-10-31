import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';
import NetlifyCmsWidgetCode from 'netlify-cms-widget-code';

CMS.registerWidget(NetlifyCmsWidgetCode.Widget());

CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});
