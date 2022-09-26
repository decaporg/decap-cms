import {
  NetlifyCmsCore as CMS,
  MediaLibraryCloudinary,
  MediaLibraryUploadcare,
} from 'netlify-cms-core';
import moment from 'moment';
import './extensions';

// Log version
if (typeof window !== 'undefined') {
  if (typeof NETLIFY_CMS_APP_VERSION === 'string') {
    console.log(`netlify-cms-app ${NETLIFY_CMS_APP_VERSION}`);
  }
}

export { MediaLibraryCloudinary, MediaLibraryUploadcare };

export const NetlifyCmsApp = {
  ...CMS,
  moment,
};
export default CMS;
