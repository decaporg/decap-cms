import { merge } from 'lodash';

import { getLocale } from './registry';

export function getPhrases(locale) {
  const phrases = merge({}, getLocale('en'), getLocale(locale));
  return phrases;
}
