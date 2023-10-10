"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.API_ERROR = void 0;
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _extendableBuiltin(cls) {
  function ExtendableBuiltin() {
    var instance = Reflect.construct(cls, Array.from(arguments));
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    return instance;
  }
  ExtendableBuiltin.prototype = Object.create(cls.prototype, {
    constructor: {
      value: cls,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ExtendableBuiltin, cls);
  } else {
    ExtendableBuiltin.__proto__ = cls;
  }
  return ExtendableBuiltin;
}
const API_ERROR = 'API_ERROR';
exports.API_ERROR = API_ERROR;
class APIError extends _extendableBuiltin(Error) {
  constructor(message, status, api, meta = {}) {
    super(message);
    _defineProperty(this, "message", void 0);
    _defineProperty(this, "status", void 0);
    _defineProperty(this, "api", void 0);
    _defineProperty(this, "meta", void 0);
    this.message = message;
    this.status = status;
    this.api = api;
    this.name = API_ERROR;
    this.meta = meta;
  }
}
exports.default = APIError;