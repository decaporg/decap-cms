import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';
import * as locales from 'netlify-cms-locales';

Object.keys(locales).forEach(locale => {
  CMS.registerLocale(locale, locales[locale]);
});
