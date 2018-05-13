import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import { Dropdown, DropdownItem, Toggle, Icon } from 'UI';
import ToolbarButton from './ToolbarButton';

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
    className: PropTypes.string,
    buttons: ImmutablePropTypes.list
  };

  constructor(props) {
    super(props);
    this.state = {
      activePlugin: null,
    };
  }

  isHidden = button => {
    const { buttons } = this.props;
    return List.isList(buttons) ? !buttons.includes(button) : false;
  }

  render() {
    const {
      onMarkClick,
      onBlockClick,
      onLinkClick,
      selectionHasMark,
      selectionHasBlock,
      selectionHasLink,
      onToggleMode,
      rawMode,
      plugins,
      onAddAsset,
      getAsset,
      disabled,
      onSubmit,
      className,
    } = this.props;

    const { activePlugin } = this.state;

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
      <div className={c(className, 'nc-toolbar-Toolbar')}>
        <div>
          <ToolbarButton
            type="bold"
            label="Bold"
            icon="bold"
            onClick={onMarkClick}
            isActive={selectionHasMark}
            isHidden={this.isHidden('bold')}
            disabled={disabled}
          />
          <ToolbarButton
            type="italic"
            label="Italic"
            icon="italic"
            onClick={onMarkClick}
            isActive={selectionHasMark}
            isHidden={this.isHidden('italic')}
            disabled={disabled}
          />
          <ToolbarButton
            type="code"
            label="Code"
            icon="code"
            onClick={onMarkClick}
            isActive={selectionHasMark}
            isHidden={this.isHidden('code')}
            disabled={disabled}
          />
          <ToolbarButton
            type="link"
            label="Link"
            icon="link"
            onClick={onLinkClick}
            isActive={selectionHasLink}
            isHidden={this.isHidden('link')}
            disabled={disabled}
          />
          <ToolbarButton
            type="heading-one"
            label="Header 1"
            icon="h1"
            onClick={onBlockClick}
            isActive={selectionHasBlock}
            isHidden={this.isHidden('heading-one')}
            disabled={disabled}
          />
          <ToolbarButton
            type="heading-two"
            label="Header 2"
            icon="h2"
            onClick={onBlockClick}
            isActive={selectionHasBlock}
            isHidden={this.isHidden('heading-two')}
            disabled={disabled}
          />
          <ToolbarButton
            type="quote"
            label="Quote"
            icon="quote"
            onClick={onBlockClick}
            isActive={selectionHasBlock}
            isHidden={this.isHidden('quote')}
            disabled={disabled}
          />
          <ToolbarButton
            type="code"
            label="Code Block"
            icon="code-block"
            onClick={onBlockClick}
            isActive={selectionHasBlock}
            isHidden={this.isHidden('code-block')}
            disabled={disabled}
          />
          <ToolbarButton
            type="bulleted-list"
            label="Bulleted List"
            icon="list-bulleted"
            onClick={onBlockClick}
            isActive={selectionHasBlock}
            isHidden={this.isHidden('bulleted-list')}
            disabled={disabled}
          />
          <ToolbarButton
            type="numbered-list"
            label="Numbered List"
            icon="list-numbered"
            onClick={onBlockClick}
            isActive={selectionHasBlock}
            isHidden={this.isHidden('numbered-list')}
            disabled={disabled}
          />
          <div className="nc-toolbar-dropdown">
            <Dropdown
              dropdownTopOverlap="36px"
              button={
                <ToolbarButton
                  label="Add Component"
                  icon="add-with"
                  onClick={this.handleComponentsMenuToggle}
                  disabled={disabled}
                />
              }
            >
              {plugins && plugins.toList().map((plugin, idx) => (
                <DropdownItem key={idx} label={plugin.get('label')} onClick={() => onSubmit(plugin.get('id'))} />
              ))}
            </Dropdown>
          </div>
        </div>
        <div className="nc-markdownWidget-toolbar-toggle">
          <span
            style={{ width: toggleOffLabelWidth }}
            className={c(
              'nc-markdownWidget-toolbar-toggle-label',
              { 'nc-markdownWidget-toolbar-toggle-label-active': !rawMode },
            )}
          >
            {toggleOffLabel}
          </span>
          <Toggle
            active={rawMode}
            onChange={onToggleMode}
            className="nc-markdownWidget-toolbar-toggle"
            classNameBackground="nc-markdownWidget-toolbar-toggle-background"
          />
          <span
            style={{ width: toggleOnLabelWidth }}
            className={c(
              'nc-markdownWidget-toolbar-toggle-label',
              { 'nc-markdownWidget-toolbar-toggle-label-active': rawMode },
            )}
          >
            {toggleOnLabel}
          </span>
        </div>
      </div>
    );
  }
}
