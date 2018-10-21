/**
 * Determine whether an array of urls represents an unaltered set of Uploadcare
 * group urls. If they've been changed or any are missing, a new group will need
 * to be created to represent the current values.
 */
export function isFileGroup(files) {
  const basePatternString = `~${files.length}/nth/`;
  const mapExpression = (val, idx) => new RegExp(`${basePatternString}${idx}/$`);
  const expressions = Array.from({ length: files.length }, mapExpression);
  return expressions.every(exp => files.some(url => exp.test(url)));
}
