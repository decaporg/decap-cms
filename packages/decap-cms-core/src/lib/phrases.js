import merge from 'lodash/merge';

import { getLocale } from './registry';

export function getPhrases(locale) {
  const phrases = merge({}, getLocale('en'), getLocale(locale));
  return phrases;
}
