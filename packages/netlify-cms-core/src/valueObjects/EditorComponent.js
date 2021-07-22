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
    // We allow consumers to specify line anchors (^ and $) without a
    // multiline flag, but we need to be able to match in a multi-line
    // context. In order to do so, we replace instances of line anchors
    // with lookarounds that include \n's, so that non-multiline expressions
    // still work as expected.
    pattern: new RegExp(
      pattern.source.replace('^', '(?<=^|\n)').replace('$', '(?=$|\n)'),
      pattern.flags,
    ),
    fromBlock: bind(fromBlock) || (() => ({})),
    toBlock: bind(toBlock) || (() => 'Plugin'),
    toPreview: bind(toPreview) || (!widget && (bind(toBlock) || (() => 'Plugin'))),
    fields: fromJS(fields),
    ...remainingConfig,
  };
}
