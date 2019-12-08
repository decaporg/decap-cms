import withFileControl from './withFileControl';
import previewComponent, { useGetAssetEffect } from './FilePreview';

const controlComponent = withFileControl();
const Widget = (opts = {}) => ({
  name: 'file',
  controlComponent,
  previewComponent,
  ...opts,
});

export const NetlifyCmsWidgetFile = {
  Widget,
  controlComponent,
  previewComponent,
  withFileControl,
  useGetAssetEffect,
};
export default NetlifyCmsWidgetFile;
