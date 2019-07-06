import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';

// Media libraries
import uploadcare from 'netlify-cms-media-library-uploadcare';
import cloudinary from 'netlify-cms-media-library-cloudinary';

// Code widget and default Codemirror extensions, and probably
// css too, emotion should work here
import NetlifyCmsWidgetCode from 'netlify-cms-widget-code';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';

// Locales
import * as locales from 'netlify-cms-locales';

CMS.registerMediaLibrary(uploadcare);
CMS.registerMediaLibrary(cloudinary);
CMS.registerWidget([NetlifyCmsWidgetCode.Widget()]);
CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});

Object.keys(locales).forEach(locale => {
  CMS.registerLocale(locale, locales[locale]);
})

