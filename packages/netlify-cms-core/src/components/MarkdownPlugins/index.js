import { registerEditorComponent } from 'Lib/registry';
import image from 'netlify-cms-editor-component-image';

const plugins = [
  image,
];

plugins.forEach(registerEditorComponent);
