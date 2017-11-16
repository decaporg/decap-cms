import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import { Dropdown, DropdownItem } from '../../../../UI/Dropdown/Dropdown';
import Switch from '../../../../UI/Toggle/Toggle';
import Icon from '../../../../../icons/Icon';
import ToolbarButton from './ToolbarButton';
import ToolbarPluginForm from './ToolbarPluginForm';

export default class Toolbar extends React.Component {
  static propTypes = {
    buttons: PropTypes.object,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
    plugins: ImmutablePropTypes.map,
    onSubmit: PropTypes.func,
    onAddAsset: PropTypes.func,
    getAsset: PropTypes.func,
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = {
      activePlugin: null,
    };
  }

  render() {
    const {
      onToggleMode,
      rawMode,
      plugins,
      onAddAsset,
      getAsset,
      disabled,
      onSubmit,
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
      <div className="nc-toolbar-Toolbar">
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
          <div className="nc-toolbar-dropdown">
            <Dropdown
              button={
                <ToolbarButton
                  label="Add Component"
                  icon="add-with"
                  action={this.handleComponentsMenuToggle}
                  disabled={disabled}
                />
              }
            >
              {plugins && plugins.toList().map(plugin => (
                <DropdownItem label={plugin.get('label')} onClick={() => onSubmit(plugin.get('id'))} />
              ))}
            </Dropdown>
          </div>
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
