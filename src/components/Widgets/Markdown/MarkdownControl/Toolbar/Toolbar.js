import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Switch from 'react-toolbox/lib/switch';
import ToolbarButton from './ToolbarButton';
import ToolbarComponentsMenu from './ToolbarComponentsMenu';
import ToolbarPluginForm from './ToolbarPluginForm';
import { Icon } from '../../../../UI';
import { prefixer } from '../../../../../lib/styleHelper';

const styles = prefixer('toolbar');
const themeStyles = prefixer('theme');

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
      { label: 'Bold', icon: 'bold', state: buttons.bold },
      { label: 'Italic', icon: 'italic', state: buttons.italic },
      { label: 'Code', icon: 'code-alt', state: buttons.code },
      { label: 'Header 1', icon: 'h1', state: buttons.h1 },
      { label: 'Header 2', icon: 'h2', state: buttons.h2 },
      { label: 'Code Block', icon: 'code', state: buttons.codeBlock },
      { label: 'Quote', icon: 'quote', state: buttons.quote },
      { label: 'Bullet List', icon: 'list-bullet', state: buttons.list },
      { label: 'Numbered List', icon: 'list-numbered', state: buttons.listNumbered },
      { label: 'Link', icon: 'link', state: buttons.link },
    ];

    return (
      <div className={`${styles("Toolbar")} ${themeStyles("clearfix")}`}>
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
        <Switch label="Markdown" onChange={onToggleMode} checked={rawMode} className={styles("Toggle")}/>
      </div>
    );
  }
}
