import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Switch from '../../../../UI/Toggle/Toggle';
import ToolbarButton from './ToolbarButton';
import ToolbarComponentsMenu from './ToolbarComponentsMenu';
import ToolbarPluginForm from './ToolbarPluginForm';

export default class Toolbar extends React.Component {
  static propTypes = {
    buttons: PropTypes.object,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
    plugins: ImmutablePropTypes.map,
    onSubmit: PropTypes.func,
    onAddAsset: PropTypes.func,
    onRemoveAsset: PropTypes.func,
    getAsset: PropTypes.func,
    disabled: PropTypes.bool,
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
      onToggleMode,
      rawMode,
      plugins,
      onAddAsset,
      onRemoveAsset,
      getAsset,
      disabled,
    } = this.props;

    const buttons = this.props.buttons || {};

    const { activePlugin } = this.state;

    const buttonsConfig = [
      { label: 'Bold', icon: 'list', state: buttons.bold },
      { label: 'Italic', icon: 'list', state: buttons.italic },
      { label: 'Code', icon: 'list', state: buttons.code },
      { label: 'Header 1', icon: 'list', state: buttons.h1 },
      { label: 'Header 2', icon: 'list', state: buttons.h2 },
      { label: 'Code Block', icon: 'list', state: buttons.codeBlock },
      { label: 'Quote', icon: 'list', state: buttons.quote },
      { label: 'Bullet List', icon: 'list', state: buttons.list },
      { label: 'Numbered List', icon: 'list', state: buttons.listNumbered },
      { label: 'Link', icon: 'list', state: buttons.link },
    ];

    return (
      <div className="nc-toolbar-Toolbar nc-theme-clearfix">
        <div>
          { buttonsConfig.map((btn, i) => (
            <ToolbarButton
              key={i}
              action={btn.state && btn.state.onAction || (() => {})}
              active={btn.state && btn.state.active}
              disabled={disabled}
              {...btn}
            />
          ))}
          <ToolbarComponentsMenu
            plugins={plugins}
            onComponentMenuItemClick={this.handlePluginFormDisplay}
            disabled={disabled}
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
        </div>
        <Switch active={rawMode} onChange={onToggleMode}/>
      </div>
    );
  }
}
