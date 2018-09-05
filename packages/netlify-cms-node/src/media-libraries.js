import cms from 'netlify-cms-core';
import uploadcare from 'netlify-cms-media-library-uploadcare';

const { registerMediaLibrary } = cms;

registerMediaLibrary(uploadcare);
