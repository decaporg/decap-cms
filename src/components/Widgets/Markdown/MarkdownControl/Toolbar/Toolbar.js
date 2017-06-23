import React, { PropTypes } from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Switch from 'react-toolbox/lib/switch';
import ToolbarButton from './ToolbarButton';
import ToolbarComponentsMenu from './ToolbarComponentsMenu';
import ToolbarPluginForm from './ToolbarPluginForm';
import { Icon } from '../../../../UI';
import styles from './Toolbar.css';

export default class Toolbar extends React.Component {
  static propTypes = {
    buttons: PropTypes.object.isRequired,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
    plugins: ImmutablePropTypes.map,
    onSubmit: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      activePlugin: null,
    };
  }

  handlePluginFormDisplay = (plugin) => {
    this.setState({ activePlugin: plugin });
  }

  handlePluginFormSubmit = (plugin, pluginData) => {
    this.props.onSubmit(plugin, pluginData);
    this.setState({ activePlugin: null });
  };

  handlePluginFormCancel = (e) => {
    this.setState({ activePlugin: null });
  };

  render() {
    const {
      buttons,
      onToggleMode,
      rawMode,
      plugins,
      onAddAsset,
      onRemoveAsset,
      getAsset,
    } = this.props;

    const { activePlugin } = this.state;

    const buttonsConfig = [
      { label: 'Header 1', icon: 'h1', state: buttons.h1 },
      { label: 'Header 2', icon: 'h2', state: buttons.h2 },
      { label: 'Bold', icon: 'bold', state: buttons.bold },
      { label: 'Italic', icon: 'italic', state: buttons.italic },
      { label: 'Link', icon: 'link', state: buttons.link },
    ];

    return (
      <div className={styles.Toolbar}>
        { buttonsConfig.map((btn, i) => (
          <ToolbarButton key={i} action={btn.state.onAction} active={btn.state.active} {...btn}/>
        ))}
        <ToolbarComponentsMenu
          plugins={plugins}
          onComponentMenuItemClick={this.handlePluginFormDisplay}
        />
        {activePlugin &&
          <ToolbarPluginForm
            plugin={activePlugin}
            onSubmit={this.handlePluginFormSubmit}
            onCancel={this.handlePluginFormCancel}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
            getAsset={getAsset}
          />
        }
        <Switch label="Markdown" onChange={onToggleMode} checked={rawMode} className={styles.Toggle}/>
      </div>
    );
  }
}
