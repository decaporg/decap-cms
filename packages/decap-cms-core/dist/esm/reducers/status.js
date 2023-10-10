"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _immer = require("immer");
var _status = require("../actions/status");
const defaultState = {
  isFetching: false,
  status: {
    auth: {
      status: true
    },
    api: {
      status: true,
      statusPage: ''
    }
  },
  error: undefined
};
const status = (0, _immer.produce)((state, action) => {
  switch (action.type) {
    case _status.STATUS_REQUEST:
      state.isFetching = true;
      break;
    case _status.STATUS_SUCCESS:
      state.isFetching = false;
      state.status = action.payload.status;
      break;
    case _status.STATUS_FAILURE:
      state.isFetching = false;
      state.error = action.payload.error;
  }
}, defaultState);
var _default = status;
exports.default = _default;