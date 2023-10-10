"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = remarkImagesToText;
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * Images must be parsed as shortcodes for asset proxying. This plugin converts
 * MDAST image nodes back to text to allow shortcode pattern matching. Note that
 * this transformation only occurs for images that are the sole child of a top
 * level paragraph - any other image is left alone and treated as an inline
 * image.
 */
function remarkImagesToText() {
  return transform;
  function transform(node) {
    const children = node.children.map(child => {
      if (child.type === 'paragraph' && child.children.length === 1 && child.children[0].type === 'image') {
        const {
          alt,
          url,
          title
        } = child.children[0];
        const value = `![${alt || ''}](${url || ''}${title ? ` "${title}"` : ''})`;
        child.children = [{
          type: 'text',
          value
        }];
      }
      return child;
    });
    return _objectSpread(_objectSpread({}, node), {}, {
      children
    });
  }
}