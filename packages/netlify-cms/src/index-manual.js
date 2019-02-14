import CMS, { init } from 'netlify-cms-core/src';
import './backends';
import './widgets';
import './editor-components';
import './media-libraries';

console.log(`Using netlify-cms manual initialization required.\nDependencies['react', 'react-dom']`);

export { CMS as default, init };
