import slug from 'slug';

export function toSlug (str) {
  return slug(str.trim(), {lower: true});
}

export function removeUnicodesInFilename (str) {
  const parts = str.split('.')
  return parts.map(i => slug(i.trim(), {lower: true})).join('.');
}
