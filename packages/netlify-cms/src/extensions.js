import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';

// Media libraries
import uploadcare from 'netlify-cms-media-library-uploadcare';
import cloudinary from 'netlify-cms-media-library-cloudinary';

// Locales
import * as locales from 'netlify-cms-locales';

CMS.registerMediaLibrary(uploadcare);
CMS.registerMediaLibrary(cloudinary);

Object.keys(locales).forEach(locale => {
  CMS.registerLocale(locale, locales[locale]);
});
