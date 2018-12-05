import cms from 'netlify-cms-core';
import uploadcare from 'netlify-cms-media-library-uploadcare';
import cloudinary from 'netlify-cms-media-library-cloudinary';

const { registerMediaLibrary } = cms;

registerMediaLibrary(uploadcare);
registerMediaLibrary(cloudinary);
