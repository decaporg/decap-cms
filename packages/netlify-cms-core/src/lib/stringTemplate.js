const dateParsers = {
  year: date => date.getFullYear(),
  month: date => `0${date.getMonth() + 1}`.slice(-2),
  day: date => `0${date.getDate()}`.slice(-2),
  hour: date => `0${date.getHours()}`.slice(-2),
  minute: date => `0${date.getMinutes()}`.slice(-2),
  second: date => `0${date.getSeconds()}`.slice(-2),
};

export const SLUG_MISSING_REQUIRED_DATE = 'SLUG_MISSING_REQUIRED_DATE';
const USE_FIELD_PREFIX = 'fields.';
const templateVariablePattern = '{{([^}]+)}}';

// Allow `fields.` prefix in placeholder to override built in replacements
// like "slug" and "year" with values from fields of the same name.
function getExplicitFieldReplacement(key, data) {
  if (!key.startsWith(USE_FIELD_PREFIX)) {
    return;
  }
  const fieldName = key.substring(USE_FIELD_PREFIX.length);
  return data.get(fieldName, '');
}

export function compileStringTemplate(template, date, identifier = '', data = Map(), processor) {
  let missingRequiredDate;

  // Allow date processing (support for replacements like `{{year}}`), pass
  // `null` as the date arg.
  const useDate = date === null;

  const slug = template.replace(RegExp(templateVariablePattern, 'g'), template, (_, key) => {
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

function extractVars(template, regexp) {
  const result = regexp.exec(template);
  return result && [result[1]].concat(extractVars(template, regexp)).filter(v => v);
}

export function extractTemplateVars(template) {
  const regexp = RegExp(templateVariablePattern, 'g');
  return extractVars(template, regexp);
}
