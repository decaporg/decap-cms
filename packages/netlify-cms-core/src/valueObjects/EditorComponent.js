import { Record, fromJS } from 'immutable';
import { isFunction } from 'lodash';

const catchesNothing = /.^/;
/* eslint-disable no-unused-vars */
const EditorComponent = Record({
  id: null,
  label: 'unnamed component',
  icon: 'exclamation-triangle',
  fields: [],
  pattern: catchesNothing,
  fromBlock(match) {
    return {};
  },
  toBlock(attributes) {
    return 'Plugin';
  },
  toPreview(attributes) {
    return 'Plugin';
  },
});
/* eslint-enable */

export default function createEditorComponent(config) {
  const configObj = new EditorComponent({
    id: config.id || config.label.replace(/[^A-Z0-9]+/gi, '_'),
    label: config.label,
    icon: config.icon,
    fields: fromJS(config.fields),
    pattern: config.pattern,
    fromBlock: isFunction(config.fromBlock) ? config.fromBlock.bind(null) : null,
    toBlock: isFunction(config.toBlock) ? config.toBlock.bind(null) : null,
    toPreview: isFunction(config.toPreview)
      ? config.toPreview.bind(null)
      : config.toBlock.bind(null),
  });

  return configObj;
}
