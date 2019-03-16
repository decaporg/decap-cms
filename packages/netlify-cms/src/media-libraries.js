import { registerMediaLibrary } from 'netlify-cms-core/src';
import uploadcare from 'netlify-cms-media-library-uploadcare/src';
import cloudinary from 'netlify-cms-media-library-cloudinary/src';

registerMediaLibrary(uploadcare);
registerMediaLibrary(cloudinary);
