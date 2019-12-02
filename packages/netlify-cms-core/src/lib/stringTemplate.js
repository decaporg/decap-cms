import moment from 'moment';
import { selectInferedField } from 'Reducers/collections';

// prepends a Zero if the date has only 1 digit
function formatDate(date) {
  return `0${date}`.slice(-2);
}

export const dateParsers = {
  year: date => date.getUTCFullYear(),
  month: date => formatDate(date.getUTCMonth() + 1),
  day: date => formatDate(date.getUTCDate()),
  hour: date => formatDate(date.getUTCHours()),
  minute: date => formatDate(date.getUTCMinutes()),
  second: date => formatDate(date.getUTCSeconds()),
};

export const SLUG_MISSING_REQUIRED_DATE = 'SLUG_MISSING_REQUIRED_DATE';

const FIELD_PREFIX = 'fields.';
const templateContentPattern = '[^}{]+';
const templateVariablePattern = `{{(${templateContentPattern})}}`;

// Allow `fields.` prefix in placeholder to override built in replacements
// like "slug" and "year" with values from fields of the same name.
function getExplicitFieldReplacement(key, data) {
  if (!key.startsWith(FIELD_PREFIX)) {
    return;
  }
  const fieldName = key.substring(FIELD_PREFIX.length);
  return data.get(fieldName, '');
}

export function parseDateFromEntry(entry, collection, fieldName) {
  const dateFieldName = fieldName || selectInferedField(collection, 'date');
  if (!dateFieldName) {
    return;
  }

  const dateValue = entry.getIn(['data', dateFieldName]);
  const dateMoment = dateValue && moment(dateValue);
  if (dateMoment && dateMoment.isValid()) {
    return dateMoment.toDate();
  }
}

export function compileStringTemplate(template, date, identifier = '', data = Map(), processor) {
  let missingRequiredDate;

  // Turn off date processing (support for replacements like `{{year}}`), by passing in
  // `null` as the date arg.
  const useDate = date !== null;

  const slug = template.replace(RegExp(templateVariablePattern, 'g'), (_, key) => {
    let replacement;
    const explicitFieldReplacement = getExplicitFieldReplacement(key, data);

    if (explicitFieldReplacement) {
      replacement = explicitFieldReplacement;
    } else if (dateParsers[key] && !date) {
      missingRequiredDate = true;
      return '';
    } else if (dateParsers[key]) {
      replacement = dateParsers[key](date);
    } else if (key === 'slug') {
      replacement = identifier;
    } else {
      replacement = data.get(key, '');
    }

    if (processor) {
      return processor(replacement);
    }

    return replacement;
  });

  if (useDate && missingRequiredDate) {
    const err = new Error();
    err.name = SLUG_MISSING_REQUIRED_DATE;
    throw err;
  } else {
    return slug;
  }
}

export function extractTemplateVars(template) {
  const regexp = RegExp(templateVariablePattern, 'g');
  const contentRegexp = RegExp(templateContentPattern, 'g');
  const matches = template.match(regexp) || [];
  return matches.map(elem => elem.match(contentRegexp)[0]);
}
