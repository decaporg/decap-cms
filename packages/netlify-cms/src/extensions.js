import {
  NetlifyCmsApp as CMS,
  MediaLibraryCloudinary,
  MediaLibraryUploadcare,
} from 'netlify-cms-app/dist/esm';

CMS.registerMediaLibrary(MediaLibraryCloudinary);
CMS.registerMediaLibrary(MediaLibraryUploadcare);
