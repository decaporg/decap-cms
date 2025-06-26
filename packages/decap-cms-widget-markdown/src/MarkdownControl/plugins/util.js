import castArray from 'lodash/castArray';
import isArray from 'lodash/isArray';

export function assertType(nodes, type) {
  const nodesArray = castArray(nodes);
  const validate = isArray(type) ? node => type.includes(node.type) : node => type === node.type;
  const invalidNode = nodesArray.find(node => !validate(node));
  if (invalidNode) {
    throw Error(`Expected node of type "${type}", received "${invalidNode.type}".`);
  }
  return true;
}
