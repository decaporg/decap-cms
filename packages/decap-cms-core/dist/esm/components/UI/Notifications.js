"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _injectStyle = require("react-toastify/dist/inject-style");
var _reactToastify = require("react-toastify");
var _reactRedux = require("react-redux");
var _reactPolyglot = require("react-polyglot");
var _notifications = require("../../actions/notifications");
var _core = require("@emotion/core");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } // eslint-disable-next-line no-unused-vars
// import { translate } from 'react-polyglot';
(0, _injectStyle.injectStyle)();
function Notifications({
  notifications
}) {
  const t = (0, _reactPolyglot.useTranslate)();
  const dispatch = (0, _reactRedux.useDispatch)();
  const [idMap, setIdMap] = _react.default.useState({});
  (0, _react.useEffect)(() => {
    notifications.filter(notification => !idMap[notification.id]).forEach(notification => {
      const toastId = (0, _reactToastify.toast)(typeof notification.message == 'string' ? notification.message : t(notification.message.key, _objectSpread({}, notification.message)), {
        autoClose: notification.dismissAfter,
        type: notification.type
      });
      idMap[notification.id] = toastId;
      setIdMap(idMap);
      if (notification.dismissAfter) {
        setTimeout(() => {
          dispatch((0, _notifications.dismissNotification)(notification.id));
        }, notification.dismissAfter);
      }
    });
    Object.entries(idMap).forEach(([id, toastId]) => {
      if (!notifications.find(notification => notification.id === id)) {
        _reactToastify.toast.dismiss(toastId);
        delete idMap[id];
        setIdMap(idMap);
      }
    });
  }, [notifications]);
  _reactToastify.toast.onChange(payload => {
    if (payload.status == 'removed') {
      var _Object$entries$find;
      const id = (_Object$entries$find = Object.entries(idMap).find(([, toastId]) => toastId === payload.id)) === null || _Object$entries$find === void 0 ? void 0 : _Object$entries$find[0];
      if (id) {
        dispatch((0, _notifications.dismissNotification)(id));
      }
    }
  });
  return (0, _core.jsx)(_react.default.Fragment, null, (0, _core.jsx)(_reactToastify.ToastContainer, {
    position: "top-right",
    theme: "colored",
    className: "notif__container"
  }));
}
function mapStateToProps({
  notifications
}) {
  return {
    notifications: notifications.notifications
  };
}
var _default = (0, _reactRedux.connect)(mapStateToProps)(Notifications);
exports.default = _default;