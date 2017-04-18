import React, { PropTypes } from 'react';
import { List } from 'immutable';
import ToolbarButton from './ToolbarButton';
import ToolbarPluginForm from './ToolbarPluginForm';
import { Icon } from '../../../UI';
import styles from './Toolbar.css';

export default class Toolbar extends React.Component {
  static propTypes = {
    onH1: PropTypes.func.isRequired,
    onH2: PropTypes.func.isRequired,
    onBold: PropTypes.func.isRequired,
    onItalic: PropTypes.func.isRequired,
    onLink: PropTypes.func.isRequired,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
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
    const {
      onH1,
      onH2,
      onBold,
      onItalic,
      onLink,
      onToggleMode,
      rawMode,
      plugins,
      onAddAsset,
      onRemoveAsset,
      getAsset,
    } = this.props;

    const { openPlugin } = this.state;

    return (
      <div className={styles.Toolbar}>
        <ToolbarButton label="Header 1" icon="h1" action={onH1}/>
        <ToolbarButton label="Header 2" icon="h2" action={onH2}/>
        <ToolbarButton label="Bold" icon="bold" action={onBold}/>
        <ToolbarButton label="Italic" icon="italic" action={onItalic}/>
        <ToolbarButton label="Link" icon="link" action={onLink}/>
        <div className={styles.Toggle}>
          <ToolbarButton label="Toggle Markdown" action={onToggleMode} active={rawMode}/>
        </div>
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
      </div>
    );
  }
}
