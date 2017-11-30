import { registerEditorComponent } from 'Lib/registry';
import image from './image';

const plugins = [
  image,
];

plugins.forEach(registerEditorComponent);
