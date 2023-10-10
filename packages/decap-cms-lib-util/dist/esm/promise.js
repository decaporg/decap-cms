"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flowAsync = flowAsync;
exports.onlySuccessfulPromises = onlySuccessfulPromises;
exports.then = then;
var _flow = _interopRequireDefault(require("lodash/flow"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function then(fn) {
  return p => Promise.resolve(p).then(fn);
}
const filterPromiseSymbol = Symbol('filterPromiseSymbol');
function onlySuccessfulPromises(promises) {
  return Promise.all(promises.map(p => p.catch(() => filterPromiseSymbol))).then(results => results.filter(result => result !== filterPromiseSymbol));
}
function wrapFlowAsync(fn) {
  return async arg => fn(await arg);
}
function flowAsync(fns) {
  return (0, _flow.default)(fns.map(fn => wrapFlowAsync(fn)));
}