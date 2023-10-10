"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertType = assertType;
var _isArray2 = _interopRequireDefault(require("lodash/isArray"));
var _castArray2 = _interopRequireDefault(require("lodash/castArray"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function assertType(nodes, type) {
  const nodesArray = (0, _castArray2.default)(nodes);
  const validate = (0, _isArray2.default)(type) ? node => type.includes(node.type) : node => type === node.type;
  const invalidNode = nodesArray.find(node => !validate(node));
  if (invalidNode) {
    throw Error(`Expected node of type "${type}", received "${invalidNode.type}".`);
  }
  return true;
}