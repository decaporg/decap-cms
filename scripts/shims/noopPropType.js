/**
 * Stand-in for `react-style-proptype`, which `react-split-pane` imports only to
 * declare `propTypes`. React 19 never runs propTypes checks, so the real
 * validator is dead weight in browser bundles.
 */
module.exports = function noopPropType() {
  return null;
};
