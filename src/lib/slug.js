import registry from './registry';

const SLUGFORMATTERKEY = 'slugformatter';

function defaultSlugFormatter (value) {
  return value;
}

function slug (value) {
  const registerred = registry.getWidgetValueSerializer(SLUGFORMATTERKEY);
  return registerred ? registerred(value) : defaultSlugFormatter(value);
}

export function toSlug (str) {
  return slug(str.trim(), {lower: true});
}

export function removeUnicodesInFilename (str) {
  const parts = str.split('.')
  return parts.map(i => slug(i.trim(), {lower: true})).join('.');
}
