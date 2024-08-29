import matchedAncestors from './matchedAncestors';

function lowestMatchedAncestor(editor, format) {
  return matchedAncestors(editor, format, 'lowest');
}
export default lowestMatchedAncestor;
