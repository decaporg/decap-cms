"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = remarkPaddedLinks;
var _flatMap2 = _interopRequireDefault(require("lodash/flatMap"));
var _trimEnd2 = _interopRequireDefault(require("lodash/trimEnd"));
var _trimStart2 = _interopRequireDefault(require("lodash/trimStart"));
var _endsWith2 = _interopRequireDefault(require("lodash/endsWith"));
var _startsWith2 = _interopRequireDefault(require("lodash/startsWith"));
var _findLast2 = _interopRequireDefault(require("lodash/findLast"));
var _find2 = _interopRequireDefault(require("lodash/find"));
var _unistBuilder = _interopRequireDefault(require("unist-builder"));
var _mdastUtilToString = _interopRequireDefault(require("mdast-util-to-string"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * Convert leading and trailing spaces in a link to single spaces outside of the
 * link. MDASTs derived from pasted Google Docs HTML require this treatment.
 *
 * Note that, because we're potentially replacing characters in a link node's
 * children with character's in a link node's siblings, we have to operate on a
 * parent (link) node and its children at once, rather than just processing
 * children one at a time.
 */
function remarkPaddedLinks() {
  function transform(node) {
    /**
     * Because we're operating on link nodes and their children at once, we can
     * exit if the current node has no children.
     */
    if (!node.children) return node;

    /**
     * Process a node's children if any of them are links. If a node is a link
     * with leading or trailing spaces, we'll get back an array of nodes instead
     * of a single node, so we use `flatMap` to keep those nodes as siblings
     * with the other children.
     *
     * If performance improvements are found desirable, we could change this to
     * only pass in the link nodes instead of the entire array of children, but
     * this seems unlikely to produce a noticeable perf gain.
     */
    const hasLinkChild = node.children.some(child => child.type === 'link');
    const processedChildren = hasLinkChild ? (0, _flatMap2.default)(node.children, transformChildren) : node.children;

    /**
     * Run all children through the transform recursively.
     */
    const children = processedChildren.map(transform);
    return _objectSpread(_objectSpread({}, node), {}, {
      children
    });
  }
  function transformChildren(node) {
    if (node.type !== 'link') return node;

    /**
     * Get the node's complete string value, check for leading and trailing
     * whitespace, and get nodes from each edge where whitespace is found.
     */
    const text = (0, _mdastUtilToString.default)(node);
    const leadingWhitespaceNode = (0, _startsWith2.default)(text, ' ') && getEdgeTextChild(node);
    const trailingWhitespaceNode = (0, _endsWith2.default)(text, ' ') && getEdgeTextChild(node, true);
    if (!leadingWhitespaceNode && !trailingWhitespaceNode) return node;

    /**
     * Trim the edge nodes in place. Unified handles everything in a mutable
     * fashion, so it's often simpler to do the same when working with Unified
     * ASTs.
     */
    if (leadingWhitespaceNode) {
      leadingWhitespaceNode.value = (0, _trimStart2.default)(leadingWhitespaceNode.value);
    }
    if (trailingWhitespaceNode) {
      trailingWhitespaceNode.value = (0, _trimEnd2.default)(trailingWhitespaceNode.value);
    }

    /**
     * Create an array of nodes. The first and last child will either be `false`
     * or a text node. We filter out the false values before returning.
     */
    const nodes = [leadingWhitespaceNode && (0, _unistBuilder.default)('text', ' '), node, trailingWhitespaceNode && (0, _unistBuilder.default)('text', ' ')];
    return nodes.filter(val => val);
  }

  /**
   * Get the first or last non-blank text child of a node, regardless of
   * nesting. If `end` is truthy, get the last node, otherwise first.
   */
  function getEdgeTextChild(node, end) {
    /**
     * This was changed from a ternary to a long form if due to issues with istanbul's instrumentation and babel's code
     * generation.
     * TODO: watch https://github.com/istanbuljs/babel-plugin-istanbul/issues/95
     * when it is resolved then revert to ```const findFn = end ? findLast : find;```
     */
    let findFn;
    if (end) {
      findFn = _findLast2.default;
    } else {
      findFn = _find2.default;
    }
    let edgeChildWithValue;
    setEdgeChildWithValue(node);
    return edgeChildWithValue;

    /**
     * searchChildren checks a node and all of it's children deeply to find a
     * non-blank text value. When the text node is found, we set it in an outside
     * variable, as it may be deep in the tree and therefore wouldn't be returned
     * by `find`/`findLast`.
     */
    function setEdgeChildWithValue(child) {
      if (!edgeChildWithValue && child.value) {
        edgeChildWithValue = child;
      }
      findFn(child.children, setEdgeChildWithValue);
    }
  }
  return transform;
}