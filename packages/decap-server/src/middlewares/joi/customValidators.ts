import Joi from '@hapi/joi';

import { resolveRepoPath } from '../utils/path';

export function pathTraversal(repoPath: string) {
  return Joi.extend({
    type: 'path',
    base: Joi.string().required(),
    messages: {
      'path.invalid': '{{#label}} must resolve to a path under the configured repository',
    },
    validate(value, helpers) {
      try {
        resolveRepoPath(repoPath, value);
      } catch (e) {
        return { value, errors: helpers.error('path.invalid') };
      }
    },
  }).path();
}
