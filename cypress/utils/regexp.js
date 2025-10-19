const escapeRegExp = string => {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

module.exports = { escapeRegExp };
