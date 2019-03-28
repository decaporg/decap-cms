import { NetlifyCmsCore as CMS } from 'netlify-cms-core';
import './backends';
import './widgets';
import './editor-components';

export const NetlifyCmsApp = {
  ...CMS,
};
export default CMS;
