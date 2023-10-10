"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = remarkSquashReferences;
var _flatten2 = _interopRequireDefault(require("lodash/flatten"));
var _without2 = _interopRequireDefault(require("lodash/without"));
var _unistBuilder = _interopRequireDefault(require("unist-builder"));
var _mdastUtilDefinitions = _interopRequireDefault(require("mdast-util-definitions"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * Raw markdown may contain image references or link references. Because there
 * is no way to maintain these references within the Slate AST, we convert image
 * and link references to standard images and links by putting their url's
 * inline. The definitions are then removed from the document.
 *
 * For example, the following markdown:
 *
 * ```
 * ![alpha][bravo]
 *
 * [bravo]: http://example.com/example.jpg
 * ```
 *
 * Yields:
 *
 * ```
 * ![alpha](http://example.com/example.jpg)
 * ```
 *
 */
function remarkSquashReferences() {
  return getTransform;
  function getTransform(node) {
    const getDefinition = (0, _mdastUtilDefinitions.default)(node);
    return transform.call(null, getDefinition, node);
  }
  function transform(getDefinition, node) {
    /**
     * Bind the `getDefinition` function to `transform` and recursively map all
     * nodes.
     */
    const boundTransform = transform.bind(null, getDefinition);
    const children = node.children ? node.children.map(boundTransform) : node.children;

    /**
     * Combine reference and definition nodes into standard image and link
     * nodes.
     */
    if (['imageReference', 'linkReference'].includes(node.type)) {
      const type = node.type === 'imageReference' ? 'image' : 'link';
      const definition = getDefinition(node.identifier);
      if (definition) {
        const {
          title,
          url
        } = definition;
        return (0, _unistBuilder.default)(type, {
          title,
          url,
          alt: node.alt
        }, children);
      }
      const pre = (0, _unistBuilder.default)('text', node.type === 'imageReference' ? '![' : '[');
      const post = (0, _unistBuilder.default)('text', ']');
      const nodes = children || [(0, _unistBuilder.default)('text', node.alt)];
      return [pre, ...nodes, post];
    }

    /**
     * Remove definition nodes and filter the resulting null values from the
     * filtered children array.
     */
    if (node.type === 'definition') {
      return null;
    }
    const filteredChildren = (0, _without2.default)(children, null);
    return _objectSpread(_objectSpread({}, node), {}, {
      children: (0, _flatten2.default)(filteredChildren)
    });
  }
}