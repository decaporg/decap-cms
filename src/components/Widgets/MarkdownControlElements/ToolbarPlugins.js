import React, { Component, PropTypes } from 'react';
import { fromJS } from 'immutable';
import { Button } from 'react-toolbox/lib/button';
import { Icon } from '../../UI';
import ToolbarButton from './ToolbarButton';
import ToolbarPluginForm from './ToolbarPluginForm';
import ToolbarPluginFormControl from './ToolbarPluginFormControl';
import toolbarStyles from './Toolbar.css';
import styles from './ToolbarPlugins.css';

export default class ToolbarPlugins extends Component {
  static propTypes = {
    plugins: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      openPlugin: null,
    };
  }

  handlePlugin(plugin) {
    return (e) => {
      e.preventDefault();
      this.setState({ openPlugin: plugin });
    };
  }

  handleSubmit = (plugin, pluginData) => {
    this.props.onSubmit(plugin, pluginData);
    this.setState({ openPlugin: null });
  };

  handleCancel = (e) => {
    this.setState({ openPlugin: null });
  };

  render() {
    const { plugins, onAddAsset, onRemoveAsset, getAsset } = this.props;
    const { openPlugin, pluginData } = this.state;
    const classNames = [styles.root];

    if (openPlugin) {
      classNames.push(styles.openPlugin);
    }

    return (<div className={classNames.join(' ')}>
      {plugins.map(plugin => (
        <ToolbarButton
          key={`plugin-${plugin.get('id')}`}
          label={plugin.get('label')}
          icon={plugin.get('icon')}
          action={this.handlePlugin(plugin)}
        />
      ))}
      {openPlugin &&
        <ToolbarPluginForm
          plugin={openPlugin}
          onSubmit={this.handleSubmit}
          onCancel={this.handleCancel}
          onAddAsset={onAddAsset}
          onRemoveAsset={onRemoveAsset}
          getAsset={getAsset}
        />
      }
    </div>);
  }
}
