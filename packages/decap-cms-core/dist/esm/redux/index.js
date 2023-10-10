"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.store = void 0;
var _redux = require("redux");
var _reduxDevtoolsExtension = require("redux-devtools-extension");
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _waitUntilAction = require("./middleware/waitUntilAction");
var _combinedReducer = _interopRequireDefault(require("../reducers/combinedReducer"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const store = (0, _redux.createStore)((0, _combinedReducer.default)(), (0, _reduxDevtoolsExtension.composeWithDevTools)((0, _redux.applyMiddleware)(_reduxThunk.default, _waitUntilAction.waitUntilAction)));
exports.store = store;