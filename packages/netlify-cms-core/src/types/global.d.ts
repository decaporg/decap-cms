declare global {
  import type { CmsConfig } from './interface';

  interface Window {
    CMS_CONFIG?: CmsConfig;
    CMS_ENV?: string;
  }
}
