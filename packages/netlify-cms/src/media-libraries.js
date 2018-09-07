import cms from 'netlify-cms-core/src';
import uploadcare from 'netlify-cms-media-library-uploadcare/src';

const { registerMediaLibrary } = cms;

registerMediaLibrary(uploadcare);
