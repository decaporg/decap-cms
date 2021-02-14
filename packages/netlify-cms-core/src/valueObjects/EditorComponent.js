import { fromJS } from 'immutable';
import { isFunction } from 'lodash';

const catchesNothing = /.^/;

function bind(fn) {
  return isFunction(fn) && fn.bind(null);
}

export default function createEditorComponent(config) {
  const {
    id = null,
    label = 'unnamed component',
    icon = 'exclamation-triangle',
    type = 'shortcode',
    widget = 'object',
    pattern = catchesNothing,
    fields = [],
    fromBlock,
    toBlock,
    toPreview,
    ...remainingConfig
  } = config;

  return {
    id: id || label.replace(/[^A-Z0-9]+/gi, '_'),
    label,
    type,
    icon,
    widget,
    // enforce multiline flag, exclude others
    pattern,
    fromBlock: bind(fromBlock) || (() => ({})),
    toBlock: bind(toBlock) || (() => 'Plugin'),
    toPreview: bind(toPreview) || (!widget && (bind(toBlock) || (() => 'Plugin'))),
    fields: fromJS(fields),
    ...remainingConfig,
  };
}
