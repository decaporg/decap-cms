import { Map } from 'immutable';
import { get, trimEnd, truncate } from 'lodash';
import dayjs from 'dayjs';
import { basename, dirname, extname } from 'path';

const filters = [
  { pattern: /^upper$/, transform: (str: string) => str.toUpperCase() },
  {
    pattern: /^lower$/,
    transform: (str: string) => str.toLowerCase(),
  },
  {
    pattern: /^date\('(.+)'\)$/,
    transform: (str: string, match: RegExpMatchArray) => dayjs(str).format(match[1]),
  },
  {
    pattern: /^default\('(.+)'\)$/,
    transform: (str: string, match: RegExpMatchArray) => (str ? str : match[1]),
  },
  {
    pattern: /^ternary\('(.*)',\s*'(.*)'\)$/,
    transform: (str: string, match: RegExpMatchArray) => (str ? match[1] : match[2]),
  },
  {
    pattern: /^truncate\(([0-9]+)(?:(?:,\s*['"])([^'"]*)(?:['"]))?\)$/,
    transform: (str: string, match: RegExpMatchArray) => {
      const omission = match[2] || '...';
      const length = parseInt(match[1]) + omission.length;

      return truncate(str, {
        length,
        omission,
      });
    },
  },
];

const FIELD_PREFIX = 'fields.';
const templateContentPattern = '([^}{|]+)';
const filterPattern = '( \\| ([^}{]+))?';
const templateVariablePattern = `{{${templateContentPattern}${filterPattern}}}`;

// prepends a Zero if the date has only 1 digit
function formatDate(date: number) {
  return `0${date}`.slice(-2);
}

export const dateParsers: Record<string, (date: Date) => string> = {
  year: (date: Date) => `${date.getUTCFullYear()}`,
  month: (date: Date) => formatDate(date.getUTCMonth() + 1),
  day: (date: Date) => formatDate(date.getUTCDate()),
  hour: (date: Date) => formatDate(date.getUTCHours()),
  minute: (date: Date) => formatDate(date.getUTCMinutes()),
  second: (date: Date) => formatDate(date.getUTCSeconds()),
};

export function parseDateFromEntry(entry: Map<string, unknown>, dateFieldName?: string | null) {
  if (!dateFieldName) {
    return;
  }

  const dateValue = entry.getIn(['data', dateFieldName]);
  const dateDayjs = dateValue && dayjs(dateValue);
  if (dateDayjs && dateDayjs.isValid()) {
    return dateDayjs.toDate();
  }
}

export const SLUG_MISSING_REQUIRED_DATE = 'SLUG_MISSING_REQUIRED_DATE';

export function keyToPathArray(key?: string) {
  if (!key) {
    return [];
  }
  const parts = [];
  const separator = '';
  const chars = key.split(separator);

  let currentChar;
  let currentStr = [];
  while ((currentChar = chars.shift())) {
    if (['[', ']', '.'].includes(currentChar)) {
      if (currentStr.length > 0) {
        parts.push(currentStr.join(separator));
      }
      currentStr = [];
    } else {
      currentStr.push(currentChar);
    }
  }
  if (currentStr.length > 0) {
    parts.push(currentStr.join(separator));
  }
  return parts;
}

export function expandPath({
  data,
  path,
  paths = [],
}: {
  data: Record<string, unknown>;
  path: string;
  paths?: string[];
}) {
  if (path.endsWith('.*')) {
    path = path + '.';
  }

  const sep = '.*.';
  const parts = path.split(sep);
  if (parts.length === 1) {
    paths.push(path);
  } else {
    const partialPath = parts[0];
    const value = get(data, partialPath);

    if (Array.isArray(value)) {
      value.forEach((_, index) => {
        expandPath({
          data,
          path: trimEnd(`${partialPath}.${index}.${parts.slice(1).join(sep)}`, '.'),
          paths,
        });
      });
    }
  }

  return paths;
}

// Allow `fields.` prefix in placeholder to override built in replacements
// like "slug" and "year" with values from fields of the same name.
function getExplicitFieldReplacement(key: string, data: Map<string, unknown>) {
  if (!key.startsWith(FIELD_PREFIX)) {
    return;
  }
  const fieldName = key.slice(FIELD_PREFIX.length);
  const value = data.getIn(keyToPathArray(fieldName));
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return value;
}

function getFilterFunction(filterStr: string) {
  if (filterStr) {
    let match: RegExpMatchArray | null = null;
    const filter = filters.find(filter => {
      match = filterStr.match(filter.pattern);
      return !!match;
    });

    if (filter) {
      return (str: string) => filter.transform(str, match as RegExpMatchArray);
    }
  }
  return null;
}

export function compileStringTemplate(
  template: string,
  date: Date | undefined | null,
  identifier = '',
  data = Map<string, unknown>(),
  processor?: (value: string) => string,
) {
  let missingRequiredDate;

  // Turn off date processing (support for replacements like `{{year}}`), by passing in
  // `null` as the date arg.
  const useDate = date !== null;

  const compiledString = template.replace(
    RegExp(templateVariablePattern, 'g'),
    (_full, key: string, _part, filter: string) => {
      let replacement;
      const explicitFieldReplacement = getExplicitFieldReplacement(key, data);

      if (explicitFieldReplacement) {
        replacement = explicitFieldReplacement;
      } else if (dateParsers[key] && !date) {
        missingRequiredDate = true;
        return '';
      } else if (dateParsers[key]) {
        replacement = dateParsers[key](date as Date);
      } else if (key === 'slug') {
        replacement = identifier;
      } else {
        replacement = data.getIn(keyToPathArray(key), '') as string;
      }

      if (processor) {
        return processor(replacement);
      } else {
        const filterFunction = getFilterFunction(filter);
        if (filterFunction) {
          replacement = filterFunction(replacement);
        }
      }

      return replacement;
    },
  );

  if (useDate && missingRequiredDate) {
    const err = new Error();
    err.name = SLUG_MISSING_REQUIRED_DATE;
    throw err;
  } else {
    return compiledString;
  }
}

export function extractTemplateVars(template: string) {
  const regexp = RegExp(templateVariablePattern, 'g');
  const contentRegexp = RegExp(templateContentPattern, 'g');
  const matches = template.match(regexp) || [];
  return matches.map(elem => {
    const match = elem.match(contentRegexp);
    return match ? match[0] : '';
  });
}

/**
 * Appends `dirname`, `filename` and `extension` to the provided `fields` map.
 * @param entryPath
 * @param fields
 * @param folder - optionally include a folder that the dirname will be relative to.
 *   eg: `addFileTemplateFields('foo/bar/baz.ext', fields, 'foo')`
 *       will result in: `{ dirname: 'bar', filename: 'baz', extension: 'ext' }`
 */
export function addFileTemplateFields(entryPath: string, fields: Map<string, string>, folder = '') {
  if (!entryPath) {
    return fields;
  }

  const extension = extname(entryPath);
  const filename = basename(entryPath, extension);
  const dirnameExcludingFolder = dirname(entryPath).replace(new RegExp(`^(/?)${folder}/?`), '$1');
  fields = fields.withMutations(map => {
    map.set('dirname', dirnameExcludingFolder);
    map.set('filename', filename);
    map.set('extension', extension === '' ? extension : extension.slice(1));
  });

  return fields;
}
