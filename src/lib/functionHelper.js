import { isImmutable } from 'immutable';
import { isString } from 'lodash';

/**
 * Turns a string or Immutable object into a JS object.
 * Useful for function options.
 * 
 * The first parameter should be the object key
 *  that you want set if the option is a string.
 * 
 * Example Usage:
 *   const { bob = true, cat = false } = stringOptions('cat', options);
 */
export function stringOptions(defaultKey, options) {
  if (options === undefined) {
    return {};
  } else if (isString(options)) {
      return { [defaultKey]: options };
  } else if (isImmutable(options)) {
      return options.toJS();
  } else {
      return options;
  }
}