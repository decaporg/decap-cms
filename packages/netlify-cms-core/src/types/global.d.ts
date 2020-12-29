import { CmsConfig } from './redux';

declare global {
  interface Window {
    CMS_CONFIG?: CmsConfig;
  }
}
