"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = remarkToRehypeShortcodes;
var _has2 = _interopRequireDefault(require("lodash/has"));
var _map2 = _interopRequireDefault(require("lodash/map"));
var _react = _interopRequireDefault(require("react"));
var _server = require("react-dom/server");
var _unistBuilder = _interopRequireDefault(require("unist-builder"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * This plugin doesn't actually transform Remark (MDAST) nodes to Rehype
 * (HAST) nodes, but rather, it prepares an MDAST shortcode node for HAST
 * conversion by replacing the shortcode text with stringified HTML for
 * previewing the shortcode output.
 */
function remarkToRehypeShortcodes({
  plugins,
  getAsset,
  resolveWidget
}) {
  return transform;
  function transform(root) {
    const transformedChildren = (0, _map2.default)(root.children, processShortcodes);
    return _objectSpread(_objectSpread({}, root), {}, {
      children: transformedChildren
    });
  }

  /**
   * Mapping function to transform nodes that contain shortcodes.
   */
  function processShortcodes(node) {
    /**
     * If the node doesn't contain shortcode data, return the original node.
     */
    if (!(0, _has2.default)(node, ['data', 'shortcode'])) return node;

    /**
     * Get shortcode data from the node, and retrieve the matching plugin by
     * key.
     */
    const {
      shortcode,
      shortcodeData
    } = node.data;
    const plugin = plugins.get(shortcode);

    /**
     * Run the shortcode plugin's `toPreview` method, which will return either
     * an HTML string or a React component. If a React component is returned,
     * render it to an HTML string.
     */
    const value = getPreview(plugin, shortcodeData);
    const valueHtml = typeof value === 'string' ? value : (0, _server.renderToString)(value);

    /**
     * Return a new 'html' type node containing the shortcode preview markup.
     */
    const textNode = (0, _unistBuilder.default)('html', valueHtml);
    const children = [textNode];
    return _objectSpread(_objectSpread({}, node), {}, {
      children
    });
  }

  /**
   * Retrieve the shortcode preview component.
   */
  function getPreview(plugin, shortcodeData) {
    const {
      toPreview,
      widget,
      fields
    } = plugin;
    if (toPreview) {
      return toPreview(shortcodeData, getAsset, fields);
    }
    const preview = resolveWidget(widget);
    return /*#__PURE__*/_react.default.createElement(preview.preview, {
      value: shortcodeData,
      field: plugin,
      getAsset
    });
  }
}