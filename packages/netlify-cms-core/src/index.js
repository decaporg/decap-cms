import bootstrap from './bootstrap';
import registry from 'Lib/registry';

const CMS = registry;
CMS.init = bootstrap;

export default CMS;
