import type { CmsConfig } from './redux';

declare global {
  interface Window {
    CMS_CONFIG?: CmsConfig;
    CMS_ENV?: string;
  }
}
