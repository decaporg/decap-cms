import PropTypes from 'prop-types';
import { Component, Children } from 'react';
import { List, Record, fromJS } from 'immutable';
import { isFunction } from 'lodash';

const plugins = { editor: List() };

const catchesNothing = /.^/;
const EditorComponent = Record({
  id: null,
  label: 'unnamed component',
  icon: 'exclamation-triangle',
  fields: [],
  pattern: catchesNothing,
  fromBlock(match) { return {}; },
  toBlock(attributes) { return 'Plugin'; },
  toPreview(attributes) { return 'Plugin'; },
});


class Plugin extends Component { // eslint-disable-line
  static propTypes = {
    children: PropTypes.element.isRequired,
  };

  static childContextTypes = {
    plugins: PropTypes.object,
  };

  getChildContext() {
    return { plugins };
  }

  render() {
    return Children.only(this.props.children);
  }
}

export function newEditorPlugin(config) {
  const configObj = new EditorComponent({
    id: config.id || config.label.replace(/[^A-Z0-9]+/ig, '_'),
    label: config.label,
    icon: config.icon,
    fields: fromJS(config.fields),
    pattern: config.pattern,
    fromBlock: isFunction(config.fromBlock) ? config.fromBlock.bind(null) : null,
    toBlock: isFunction(config.toBlock) ? config.toBlock.bind(null) : null,
    toPreview: isFunction(config.toPreview) ? config.toPreview.bind(null) : config.toBlock.bind(null),
  });


  return configObj;
}
