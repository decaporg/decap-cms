
exports.__ = function(str) {
  return window.langStrings ? window.langStrings[str] : str
}
