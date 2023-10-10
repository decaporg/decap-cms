"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.selectUnpublishedEntriesByStatus = selectUnpublishedEntriesByStatus;
exports.selectUnpublishedEntry = selectUnpublishedEntry;
exports.selectUnpublishedSlugs = selectUnpublishedSlugs;
var _startsWith2 = _interopRequireDefault(require("lodash/startsWith"));
var _immutable = require("immutable");
var _publishModes = require("../constants/publishModes");
var _editorialWorkflow = require("../actions/editorialWorkflow");
var _config = require("../actions/config");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function unpublishedEntries(state = (0, _immutable.Map)(), action) {
  switch (action.type) {
    case _config.CONFIG_SUCCESS:
      {
        const publishMode = action.payload && action.payload.publish_mode;
        if (publishMode === _publishModes.EDITORIAL_WORKFLOW) {
          //  Editorial workflow state is explicitly initiated after the config.
          return (0, _immutable.Map)({
            entities: (0, _immutable.Map)(),
            pages: (0, _immutable.Map)()
          });
        }
        return state;
      }
    case _editorialWorkflow.UNPUBLISHED_ENTRY_REQUEST:
      return state.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'isFetching'], true);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_REDIRECT:
      return state.deleteIn(['entities', `${action.payload.collection}.${action.payload.slug}`]);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_SUCCESS:
      return state.setIn(['entities', `${action.payload.collection}.${action.payload.entry.slug}`], (0, _immutable.fromJS)(action.payload.entry));
    case _editorialWorkflow.UNPUBLISHED_ENTRIES_REQUEST:
      return state.setIn(['pages', 'isFetching'], true);
    case _editorialWorkflow.UNPUBLISHED_ENTRIES_SUCCESS:
      return state.withMutations(map => {
        action.payload.entries.forEach(entry => map.setIn(['entities', `${entry.collection}.${entry.slug}`], (0, _immutable.fromJS)(entry).set('isFetching', false)));
        map.set('pages', (0, _immutable.Map)(_objectSpread(_objectSpread({}, action.payload.pages), {}, {
          ids: (0, _immutable.List)(action.payload.entries.map(entry => entry.slug))
        })));
      });
    case _editorialWorkflow.UNPUBLISHED_ENTRY_PERSIST_REQUEST:
      {
        return state.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'isPersisting'], true);
      }
    case _editorialWorkflow.UNPUBLISHED_ENTRY_PERSIST_SUCCESS:
      // Update Optimistically
      return state.withMutations(map => {
        map.setIn(['entities', `${action.payload.collection}.${action.payload.entry.get('slug')}`], (0, _immutable.fromJS)(action.payload.entry));
        map.deleteIn(['entities', `${action.payload.collection}.${action.payload.entry.get('slug')}`, 'isPersisting']);
        map.updateIn(['pages', 'ids'], (0, _immutable.List)(), list => list.push(action.payload.entry.get('slug')));
      });
    case _editorialWorkflow.UNPUBLISHED_ENTRY_PERSIST_FAILURE:
      return state.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'isPersisting'], false);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST:
      // Update Optimistically
      return state.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'isUpdatingStatus'], true);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS:
      return state.withMutations(map => {
        map.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'status'], action.payload.newStatus);
        map.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'isUpdatingStatus'], false);
      });
    case _editorialWorkflow.UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE:
      return state.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'isUpdatingStatus'], false);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_PUBLISH_REQUEST:
      return state.setIn(['entities', `${action.payload.collection}.${action.payload.slug}`, 'isPublishing'], true);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_PUBLISH_SUCCESS:
      return state.deleteIn(['entities', `${action.payload.collection}.${action.payload.slug}`]);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_DELETE_SUCCESS:
      return state.deleteIn(['entities', `${action.payload.collection}.${action.payload.slug}`]);
    case _editorialWorkflow.UNPUBLISHED_ENTRY_PUBLISH_FAILURE:
    default:
      return state;
  }
}
function selectUnpublishedEntry(state, collection, slug) {
  return state && state.getIn(['entities', `${collection}.${slug}`]);
}
function selectUnpublishedEntriesByStatus(state, status) {
  if (!state) return null;
  const entities = state.get('entities');
  return entities.filter(entry => entry.get('status') === status).valueSeq();
}
function selectUnpublishedSlugs(state, collection) {
  if (!state.get('entities')) return null;
  const entities = state.get('entities');
  return entities.filter((_v, k) => (0, _startsWith2.default)(k, `${collection}.`)).map(entry => entry.get('slug')).valueSeq();
}
var _default = unpublishedEntries;
exports.default = _default;