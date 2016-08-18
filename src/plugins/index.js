import { Component, PropTypes, Children } from 'react';
import { List, Record } from 'immutable';
import _ from 'lodash';

const plugins = { editor: List() };

const catchesNothing = /.^/;
const EditorComponent = Record({
  id: null,
  label: 'unnamed component',
  icon: 'exclamation-triangle',
  fields: [],
  pattern: catchesNothing,
  fromBlock: function(match) { return {}; },
  toBlock: function(attributes) { return 'Plugin'; },
  toPreview: function(attributes) { return 'Plugin'; }
});

function CMS() {
  this.registerEditorComponent = (config) => {
    const configObj = new EditorComponent({
      id: config.id || config.label.replace(/[^A-Z0-9]+/ig, '_'),
      label: config.label,
      icon: config.icon,
      fields: config.fields,
      pattern: config.pattern,
      fromBlock: _.isFunction(config.fromBlock) ? config.fromBlock.bind(null) : null,
      toBlock: _.isFunction(config.toBlock) ? config.toBlock.bind(null) : null,
      toPreview: _.isFunction(config.toPreview) ? config.toPreview.bind(null) : config.toBlock.bind(null)
    });

    plugins.editor = plugins.editor.push(configObj);
  };
}


class Plugin extends Component {
  getChildContext() {
    return { plugins: plugins };
  }

  render() {
    return Children.only(this.props.children);
  }
}

Plugin.propTypes = {
  children: PropTypes.element.isRequired
};
Plugin.childContextTypes = {
  plugins: PropTypes.object
};


export const initPluginAPI = () => {
  window.CMS = new CMS();
  return Plugin;
};
