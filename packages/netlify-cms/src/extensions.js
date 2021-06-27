import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';
// Media libraries
import uploadcare from 'netlify-cms-media-library-uploadcare';
import cloudinary from 'netlify-cms-media-library-cloudinary';
import uppy from 'netlify-cms-media-library-uppy';

CMS.registerMediaLibrary(uploadcare);
CMS.registerMediaLibrary(cloudinary);
CMS.registerMediaLibrary(uppy);
