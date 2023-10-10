"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = withWorkflow;
var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _publishModes = require("../../constants/publishModes");
var _reducers = require("../../reducers");
var _collections = require("../../reducers/collections");
var _editorialWorkflow = require("../../actions/editorialWorkflow");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function mapStateToProps(state, ownProps) {
  const {
    collections
  } = state;
  const isEditorialWorkflow = state.config.publish_mode === _publishModes.EDITORIAL_WORKFLOW;
  const collection = collections.get(ownProps.match.params.name);
  const returnObj = {
    isEditorialWorkflow,
    showDelete: !ownProps.newEntry && (0, _collections.selectAllowDeletion)(collection)
  };
  if (isEditorialWorkflow) {
    const slug = ownProps.match.params[0];
    const unpublishedEntry = (0, _reducers.selectUnpublishedEntry)(state, collection.get('name'), slug);
    if (unpublishedEntry) {
      returnObj.unpublishedEntry = true;
      returnObj.entry = unpublishedEntry;
    }
  }
  return returnObj;
}
function mergeProps(stateProps, dispatchProps, ownProps) {
  const {
    isEditorialWorkflow,
    unpublishedEntry
  } = stateProps;
  const {
    dispatch
  } = dispatchProps;
  const returnObj = {};
  if (isEditorialWorkflow) {
    // Overwrite loadEntry to loadUnpublishedEntry
    returnObj.loadEntry = (collection, slug) => dispatch((0, _editorialWorkflow.loadUnpublishedEntry)(collection, slug));

    // Overwrite persistEntry to persistUnpublishedEntry
    returnObj.persistEntry = collection => dispatch((0, _editorialWorkflow.persistUnpublishedEntry)(collection, unpublishedEntry));
  }
  return _objectSpread(_objectSpread(_objectSpread({}, ownProps), stateProps), returnObj);
}
function withWorkflow(Editor) {
  return (0, _reactRedux.connect)(mapStateToProps, null, mergeProps)(class WorkflowEditor extends _react.default.Component {
    render() {
      return (0, _core.jsx)(Editor, this.props);
    }
  });
}