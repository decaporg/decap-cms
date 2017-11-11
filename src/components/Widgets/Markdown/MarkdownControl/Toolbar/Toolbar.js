import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
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
      { label: 'Bold', icon: 'bold', state: buttons.bold },
      { label: 'Italic', icon: 'italic', state: buttons.italic },
      { label: 'Code', icon: 'code', state: buttons.code },
      { label: 'Header 1', icon: 'h1', state: buttons.h1 },
      { label: 'Header 2', icon: 'h2', state: buttons.h2 },
      { label: 'Code Block', icon: 'code-block', state: buttons.codeBlock },
      { label: 'Quote', icon: 'quote', state: buttons.quote },
      { label: 'Bullet List', icon: 'list-bulleted', state: buttons.list },
      { label: 'Numbered List', icon: 'list-numbered', state: buttons.listNumbered },
      { label: 'Link', icon: 'link', state: buttons.link },
    ];

    /**
     * Because the toggle labels change font weight for active/inactive state,
     * we need to set estimated widths for them to maintain position without
     * moving other inline items on font weight change.
     */
    const toggleOffLabel = 'Rich text';
    const toggleOffLabelWidth = '62px';
    const toggleOnLabel = 'Markdown';
    const toggleOnLabelWidth = '70px';

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
          {
            activePlugin
              ? <ToolbarPluginForm
                  plugin={activePlugin}
                  onSubmit={this.handlePluginFormSubmit}
                  onCancel={this.handlePluginFormCancel}
                  onAddAsset={onAddAsset}
                  onRemoveAsset={onRemoveAsset}
                  getAsset={getAsset}
                />
              : null
          }
        </div>
        <div className="nc-markdownWidget-toolbar-markdownToggle">
          <span
            style={{ width: toggleOffLabelWidth }}
            className={c(
              'nc-markdownWidget-toolbar-markdownToggle-label',
              { 'nc-markdownWidget-toolbar-markdownToggle-label-active': !rawMode },
            )}
          >
            {toggleOffLabel}
          </span>
          <Switch
            active={rawMode}
            onChange={onToggleMode}
            className="nc-markdownWidget-toolbar-markdownToggle-switch"
          />
          <span
            style={{ width: toggleOnLabelWidth }}
            className={c(
              'nc-markdownWidget-toolbar-markdownToggle-label',
              { 'nc-markdownWidget-toolbar-markdownToggle-label-active': rawMode },
            )}
          >
            {toggleOnLabel}
          </span>
        </div>
      </div>
    );
  }
}
