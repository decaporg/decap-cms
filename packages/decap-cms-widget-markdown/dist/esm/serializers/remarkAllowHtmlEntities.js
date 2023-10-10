"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = remarkAllowHtmlEntities;
function remarkAllowHtmlEntities() {
  this.Parser.prototype.inlineTokenizers.text = text;

  /**
   * This is a port of the `remark-parse` text tokenizer, adapted to exclude
   * HTML entity decoding.
   */
  function text(eat, value, silent) {
    var self = this;
    var methods;
    var tokenizers;
    var index;
    var length;
    var subvalue;
    var position;
    var tokenizer;
    var name;
    var min;

    /* istanbul ignore if - never used (yet) */
    if (silent) {
      return true;
    }
    methods = self.inlineMethods;
    length = methods.length;
    tokenizers = self.inlineTokenizers;
    index = -1;
    min = value.length;
    while (++index < length) {
      name = methods[index];
      if (name === 'text' || !tokenizers[name]) {
        continue;
      }
      tokenizer = tokenizers[name].locator;
      if (!tokenizer) {
        eat.file.fail('Missing locator: `' + name + '`');
      }
      position = tokenizer.call(self, value, 1);
      if (position !== -1 && position < min) {
        min = position;
      }
    }
    subvalue = value.slice(0, min);
    eat(subvalue)({
      type: 'text',
      value: subvalue
    });
  }
}