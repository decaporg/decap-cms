import { CmsWidgetParam } from '../../interface';
import controlComponent from './StringControl';
import previewComponent from './StringPreview';

function Widget(opts = {}): CmsWidgetParam<string> {
  return {
    name: 'string',
    controlComponent,
    previewComponent,
    ...opts,
  };
}

export const NetlifyCmsWidgetString = { Widget, controlComponent, previewComponent };
export default NetlifyCmsWidgetString;
