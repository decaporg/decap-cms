import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';

// Media libraries
import uploadcare from 'netlify-cms-media-library-uploadcare';
import cloudinary from 'netlify-cms-media-library-cloudinary';

// Widgets
import NetlifyCmsWidgetCode from 'netlify-cms-widget-code';

// Locales
import * as locales from 'netlify-cms-locales';

CMS.registerMediaLibrary(uploadcare);
CMS.registerMediaLibrary(cloudinary);

CMS.registerWidget(NetlifyCmsWidgetCode.Widget());

Object.keys(locales).forEach(locale => {
  CMS.registerLocale(locale, locales[locale]);
});

CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});
