import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { List } from 'immutable';
import {
  Toggle,
  Dropdown,
  DropdownItem,
  DropdownButton,
  colors,
  transitions,
  lengths,
} from 'netlify-cms-ui-default';
import ToolbarButton from './ToolbarButton';

const ToolbarContainer = styled.div`
  background-color: ${colors.textFieldBorder};
  border-top-right-radius: ${lengths.borderRadius};
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  min-height: 58px;
  transition: background-color ${transitions.main}, color ${transitions.main};
  color: ${colors.text};
`;

const ToolbarDropdownWrapper = styled.div`
  display: inline-block;
  position: relative;
`;

const ToolbarToggle = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  font-size: 14px;
  margin: 0 10px;
`;

const StyledToggle = ToolbarToggle.withComponent(Toggle);

const ToolbarToggleLabel = styled.span`
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  line-height: 20px;
  width: ${props => (props.offPosition ? '62px' : '70px')};

  ${props =>
    props.isActive &&
    css`
      font-weight: 600;
      color: ${colors.active};
    `};
`;

export default class Toolbar extends React.Component {
  static propTypes = {
    buttons: ImmutablePropTypes.list,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
    plugins: ImmutablePropTypes.map,
    onSubmit: PropTypes.func,
    onAddAsset: PropTypes.func,
    getAsset: PropTypes.func,
    disabled: PropTypes.bool,
    onMarkClick: PropTypes.func,
    onBlockClick: PropTypes.func,
    onLinkClick: PropTypes.func,
    selectionHasMark: PropTypes.func,
    selectionHasBlock: PropTypes.func,
    selectionHasLink: PropTypes.func,
  };

  isHidden = button => {
    const { buttons } = this.props;
    return List.isList(buttons) ? !buttons.includes(button) : false;
  };

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
      disabled,
      onSubmit,
    } = this.props;

    return (
      <ToolbarContainer>
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
          <ToolbarDropdownWrapper>
            <Dropdown
              dropdownTopOverlap="36px"
              renderButton={() => (
                <DropdownButton>
                  <ToolbarButton
                    label="Add Component"
                    icon="add-with"
                    onClick={this.handleComponentsMenuToggle}
                    disabled={disabled}
                  />
                </DropdownButton>
              )}
            >
              {plugins &&
                plugins
                  .toList()
                  .map((plugin, idx) => (
                    <DropdownItem
                      key={idx}
                      label={plugin.get('label')}
                      onClick={() => onSubmit(plugin.get('id'))}
                    />
                  ))}
            </Dropdown>
          </ToolbarDropdownWrapper>
        </div>
        <ToolbarToggle>
          <ToolbarToggleLabel isActive={!rawMode} offPosition>
            Rich Text
          </ToolbarToggleLabel>
          <StyledToggle active={rawMode} onChange={onToggleMode} />
          <ToolbarToggleLabel isActive={rawMode}>Markdown</ToolbarToggleLabel>
        </ToolbarToggle>
      </ToolbarContainer>
    );
  }
}
