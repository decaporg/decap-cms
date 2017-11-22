import { registerEditorComponent } from '../lib/registry';
import image from './image';

const plugins = [
  image,
];

plugins.forEach(registerEditorComponent);
