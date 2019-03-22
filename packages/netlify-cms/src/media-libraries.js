import { registerMediaLibrary } from 'netlify-cms-core';
import uploadcare from 'netlify-cms-media-library-uploadcare';
import cloudinary from 'netlify-cms-media-library-cloudinary';

registerMediaLibrary(uploadcare);
registerMediaLibrary(cloudinary);
