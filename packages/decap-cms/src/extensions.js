import { DecapCmsApp as CMS } from 'decap-cms-app';
// Media libraries
import uploadcare from 'decap-cms-media-library-uploadcare';
import cloudinary from 'decap-cms-media-library-cloudinary';
import S3MediaLibrary from 'decap-cms-media-library-s3';

CMS.registerMediaLibrary(uploadcare);
CMS.registerMediaLibrary(cloudinary);
CMS.registerMediaLibrary(S3MediaLibrary);
