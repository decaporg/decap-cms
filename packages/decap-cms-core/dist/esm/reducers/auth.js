"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultState = exports.default = void 0;
var _immer = require("immer");
var _auth = require("../actions/auth");
const defaultState = {
  isFetching: false,
  user: undefined,
  error: undefined
};
exports.defaultState = defaultState;
const auth = (0, _immer.produce)((state, action) => {
  switch (action.type) {
    case _auth.AUTH_REQUEST:
      state.isFetching = true;
      break;
    case _auth.AUTH_SUCCESS:
      state.user = action.payload;
      break;
    case _auth.AUTH_FAILURE:
      state.error = action.payload && action.payload.toString();
      break;
    case _auth.AUTH_REQUEST_DONE:
      state.isFetching = false;
      break;
    case _auth.LOGOUT:
      state.user = undefined;
      state.isFetching = false;
  }
}, defaultState);
var _default = auth;
exports.default = _default;